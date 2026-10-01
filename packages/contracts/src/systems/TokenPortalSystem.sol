// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibDisabled } from "libraries/utils/LibDisabled.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibTokenPortal } from "libraries/LibTokenPortal.sol";

uint256 constant ID = uint256(keccak256("system.erc20.portal"));

// marks a receipt whose claim pays the account's operator wallet instead of its owner
string constant OPERATOR_LANE_FLAG = "PORTAL_TO_OPERATOR";

/// @notice System for bridging in ERC20 tokens into the game world (as an item).
/** @dev
 * A special system, uses local storage as the source of truth to avoid depending
 * on item registries. Not meant to be upgraded frequently, but can be if needed.
 * If redeploying, token items must be re-initialized through initItem().
 */
contract TokenPortalSystem is System, AuthRoles {
  // store item's token address/conversion rate locally, no dependence on registries
  mapping(uint32 => address) public itemAddrs;
  mapping(uint32 => int32) public itemScales;
  mapping(uint32 => bool) public laneItems; // items withdrawable through the operator lane
  bool public isEnabled;

  constructor(IWorld _world, address _components) System(_world, _components) {}

  /// @notice enable or disable the token portal
  modifier onlyEnabled() {
    require(isEnabled, "Token Portal: disabled");
    _; // Execute the rest of the function
  }

  /// @notice deposit ERC20 tokens into the game world through the token portal
  /// @dev conversion scale is determined by itemScales
  function deposit(uint32 itemIndex, uint256 itemAmt) public onlyEnabled {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // checks before action
    address tokenAddr = itemAddrs[itemIndex];
    require(tokenAddr != address(0), "Token Portal: item not registered");

    // pull tokens and increase itemIndex balance (balance check is intrinsic)
    int32 scale = itemScales[itemIndex];
    LibTokenPortal.deposit(world, components, accID, itemIndex, itemAmt, tokenAddr, scale);
    LibAccount.updateLastTs(components, accID);
  }

  /// @notice initialize a (ERC20) token withdrawal from the game world
  /// @dev creates a Withdrawal Receipt entity with delayed settlement
  function withdraw(
    uint32 itemIndex,
    uint256 itemAmt
  ) public onlyEnabled returns (uint256 receiptID) {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // checks
    address tokenAddress = itemAddrs[itemIndex];
    require(tokenAddress != address(0), "Token Portal: item not registered");

    // reduces items, creates withdrawal receipt
    int32 scale = itemScales[itemIndex];
    receiptID = LibTokenPortal.withdraw(
      world,
      components,
      accID,
      itemIndex,
      itemAmt,
      tokenAddress,
      scale
    );
    LibAccount.updateLastTs(components, accID);
  }

  /// @notice initialize a withdrawal paid to the account's operator wallet on claim
  /// @dev operator- or owner-signed; the payout address is resolved at claim time, so
  /// rotating the operator during the delay redirects (or voids) a pending receipt
  function withdrawToOperator(
    uint32 itemIndex,
    uint256 itemAmt
  ) public onlyEnabled returns (uint256 receiptID) {
    uint256 accID = getAccByOwnerOrOperator();

    address tokenAddress = itemAddrs[itemIndex];
    require(tokenAddress != address(0), "Token Portal: item not registered");
    require(laneItems[itemIndex], "Token Portal: item not on the operator lane");

    int32 scale = itemScales[itemIndex];
    receiptID = LibTokenPortal.withdraw(
      world,
      components,
      accID,
      itemIndex,
      itemAmt,
      tokenAddress,
      scale
    );
    LibFlag.set(components, receiptID, OPERATOR_LANE_FLAG, true);
    LibAccount.updateLastTs(components, accID);
  }

  /// @notice execute a pending Withdrawal Receipt
  /// @dev owner receipts: owner-signed, paid to the owner. operator-lane receipts: owner-
  /// or operator-signed, paid to the current operator
  /// @dev data logging may be wrong if itemScales entry is deleted,
  /// but token amounts and claim flow should resolve correctly
  function claim(uint256 receiptID) public onlyEnabled {
    (bool toOperator, uint256 accID, address operator) = resolveReceiptCaller(receiptID);
    LibDisabled.verifyEnabled(components, receiptID);
    LibTokenPortal.verifyTimeEnd(components, receiptID);

    // checks
    uint32 itemIndex = LibItem.getIndex(components, receiptID);
    require(itemIndex != 0, "Item Registry: item not registered");
    address tokenAddress = itemAddrs[itemIndex]; // token address as known by Portal (overrides Receipt)
    require(tokenAddress != address(0), "Token Portal: item not registered");

    address to;
    if (toOperator) {
      require(operator != address(0), "Token Portal: no operator");
      to = operator;
    } else {
      to = LibAccount.getOwner(components, accID);
    }

    // the lane flag is kept after settlement so history keeps the payout route
    int32 scale = itemScales[itemIndex];
    LibTokenPortal.claim(world, components, receiptID, accID, itemIndex, tokenAddress, scale, to);
    LibAccount.updateLastTs(components, accID);
  }

  /// @notice cancel a pending Withdrawal Receipt; owner, or operator for operator-lane receipts
  /// @dev data logging may be wrong if itemScales entry is deleted,
  /// but token amounts and claim flow should resolve correctly
  function cancel(uint256 receiptID) public onlyEnabled {
    (, uint256 accID, ) = resolveReceiptCaller(receiptID);
    LibDisabled.verifyEnabled(components, receiptID);

    uint32 itemIndex = LibItem.getIndex(components, receiptID);
    require(itemIndex != 0, "Item Registry: item not registered");

    int32 scale = itemScales[itemIndex];
    LibTokenPortal.cancel(world, components, receiptID, accID, itemIndex, scale);
    LibAccount.updateLastTs(components, accID);
  }

  //////////////////
  // ADMIN CONTROLS

  /// @notice pause a Withdrawal Receipt, as an admin
  function adminPause(uint256 receiptID) public onlyAdmin(components) {
    LibDisabled.set(components, receiptID, true);
  }

  /// @notice unpause a Withdrawal Receipt, as Owner only
  function adminUnpause(uint256 receiptID) public onlyOwner {
    LibDisabled.verifyDisabled(components, receiptID);
    LibDisabled.set(components, receiptID, false);
  }

  /// @notice cancel a Withdrawal Receipt, as an admin
  function adminCancel(uint256 receiptID) public onlyAdmin(components) {
    uint256 accID = LibTokenPortal.getReceiptAccount(components, receiptID);
    require(accID != 0, "Token Portal: no receipt");
    uint32 itemIndex = LibItem.getIndex(components, receiptID);
    int32 scale = itemScales[itemIndex];
    LibDisabled.set(components, receiptID, false);
    LibTokenPortal.cancel(world, components, receiptID, accID, itemIndex, scale);
  }

  /// @notice toggle the Portal functionality on or off, as Owner only
  function adminToggleEnabled(bool enabled) public onlyOwner {
    isEnabled = enabled;
  }

  /// @notice allow or forbid an item on the operator lane, as Owner only
  function setLaneItem(uint32 index, bool enabled) public onlyOwner {
    require(itemAddrs[index] != address(0), "Token Portal: item not registered");
    laneItems[index] = enabled;
  }

  //////////////////
  // REGISTRY

  /// @notice initialize portal item from the item registry
  /// @dev call this after system upgrades, to add items to system storage without relisting
  function initItem(uint32 index) public onlyOwner {
    uint256 id = LibItem.getByIndex(components, index);
    if (id == 0) revert("TokenPortal: item does not exist");
    LibItem.verifyType(components, index, "ERC20");
    LibItem.verifyToken(components, index, true);

    address tokenAddr = LibItem.getTokenAddr(components, index);
    int32 scale = LibItem.getScale(components, index);

    itemAddrs[index] = tokenAddr;
    itemScales[index] = scale;
  }

  /// @notice add an item to the token portal by populating its address and conversion scale
  /// @dev item must be registered through the ItemRegistrySystem first as standard item
  function setItem(uint32 index, address tokenAddr, int32 scale) public onlyOwner {
    uint256 id = LibItem.getByIndex(components, index);
    if (id == 0) revert("TokenPortal: item does not exist");
    LibItem.verifyType(components, index, "ERC20");
    LibItem.verifyToken(components, index, false);

    if (scale < 0) revert("TokenPortal: negative scale not supported");
    if (scale > 18) revert("TokenPortal: scale > 18 not supported");

    LibItem.setERC20(components, index, tokenAddr, scale);
    itemAddrs[index] = tokenAddr;
    itemScales[index] = scale;
  }

  // remove an item from the token portal
  function unsetItem(uint32 index) public onlyOwner {
    uint256 id = LibItem.getByIndex(components, index);
    if (id == 0) revert("TokenPortal: item does not exist");
    LibItem.verifyType(components, index, "ERC20");
    LibItem.verifyToken(components, index, true);

    LibItem.unsetERC20(components, index);
    delete itemAddrs[index];
    delete itemScales[index];
    delete laneItems[index];
  }

  //////////////////
  // CHECKERS

  /// @dev the sender's account, its own account first: an owner address must never be
  /// routed to an account that merely named it as operator
  function getAccByOwnerOrOperator() internal view returns (uint256) {
    if (LibAccount.isAccount(components, uint256(uint160(msg.sender))))
      return LibAccount.getByOwner(components, msg.sender);
    return LibAccount.getByOperator(components, msg.sender);
  }

  /// @dev who may settle a receipt. owner receipts: the account owner. operator-lane
  /// receipts: the account owner or its current operator (returned, for the payout)
  function resolveReceiptCaller(
    uint256 receiptID
  ) internal view returns (bool toOperator, uint256 accID, address operator) {
    accID = LibTokenPortal.getReceiptAccount(components, receiptID);
    if (accID == 0) revert("not receipt owner");
    toOperator = LibFlag.has(components, receiptID, OPERATOR_LANE_FLAG);
    address owner = LibAccount.getOwner(components, accID);
    if (toOperator) {
      operator = LibAccount.getOperator(components, accID);
      if (msg.sender != owner && msg.sender != operator) revert("not receipt owner");
    } else if (msg.sender != owner) {
      revert("not receipt owner");
    }
  }

  //////////////////
  // MISC

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
