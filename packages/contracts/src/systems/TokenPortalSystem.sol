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
    uint256 accID = getAccByOperatorOrOwner();

    address tokenAddress = itemAddrs[itemIndex];
    require(tokenAddress != address(0), "Token Portal: item not registered");

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
    bool toOperator = LibFlag.has(components, receiptID, OPERATOR_LANE_FLAG);
    uint256 accID = toOperator ? verifyLaneCaller(receiptID) : verifyOwnerCaller(receiptID);
    LibDisabled.verifyEnabled(components, receiptID);
    LibTokenPortal.verifyTimeEnd(components, receiptID);

    // checks
    uint32 itemIndex = LibItem.getIndex(components, receiptID);
    require(itemIndex != 0, "Item Registry: item not registered");
    address tokenAddress = itemAddrs[itemIndex]; // token address as known by Portal (overrides Receipt)
    require(tokenAddress != address(0), "Token Portal: item not registered");

    address to;
    if (toOperator) {
      to = LibAccount.getOperator(components, accID);
      require(to != address(0), "Token Portal: no operator");
    } else {
      to = LibAccount.getOwner(components, accID);
    }

    int32 scale = itemScales[itemIndex];
    LibTokenPortal.claim(world, components, receiptID, tokenAddress, scale, to);
    if (toOperator) LibFlag.remove(components, receiptID, OPERATOR_LANE_FLAG);
    LibAccount.updateLastTs(components, accID);
  }

  /// @notice cancel a pending Withdrawal Receipt; owner, or operator for operator-lane receipts
  /// @dev data logging may be wrong if itemScales entry is deleted,
  /// but token amounts and claim flow should resolve correctly
  function cancel(uint256 receiptID) public onlyEnabled {
    bool toOperator = LibFlag.has(components, receiptID, OPERATOR_LANE_FLAG);
    uint256 accID = toOperator ? verifyLaneCaller(receiptID) : verifyOwnerCaller(receiptID);
    LibDisabled.verifyEnabled(components, receiptID);

    uint32 itemIndex = LibItem.getIndex(components, receiptID);
    require(itemIndex != 0, "Item Registry: item not registered");

    int32 scale = itemScales[itemIndex];
    LibTokenPortal.cancel(world, components, receiptID, scale);
    if (toOperator) LibFlag.remove(components, receiptID, OPERATOR_LANE_FLAG);
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
    uint32 itemIndex = LibItem.getIndex(components, receiptID);
    int32 scale = itemScales[itemIndex];
    LibDisabled.set(components, receiptID, false);
    LibTokenPortal.cancel(world, components, receiptID, scale);
    LibFlag.remove(components, receiptID, OPERATOR_LANE_FLAG);
  }

  /// @notice toggle the Portal functionality on or off, as Owner only
  function adminToggleEnabled(bool enabled) public onlyOwner {
    isEnabled = enabled;
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
  }

  //////////////////
  // CHECKERS

  /// @dev the sender's account, preferring its operator role
  function getAccByOperatorOrOwner() internal view returns (uint256) {
    if (LibAccount.operatorInUse(components, msg.sender))
      return LibAccount.getByOperator(components, msg.sender);
    return LibAccount.getByOwner(components, msg.sender);
  }

  /// @dev owner receipts keep the original rule: the receipt's account owner must sign
  function verifyOwnerCaller(uint256 receiptID) internal view returns (uint256 accID) {
    accID = LibAccount.getByOwner(components, msg.sender);
    LibTokenPortal.verifyReceiptOwner(components, accID, receiptID);
  }

  /// @dev operator-lane receipts accept the receipt account's owner or current operator
  function verifyLaneCaller(uint256 receiptID) internal view returns (uint256 accID) {
    accID = LibTokenPortal.getReceiptAccount(components, receiptID);
    bool allowed = msg.sender == LibAccount.getOwner(components, accID) ||
      msg.sender == LibAccount.getOperator(components, accID);
    if (!allowed) revert("not receipt owner");
  }

  //////////////////
  // MISC

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
