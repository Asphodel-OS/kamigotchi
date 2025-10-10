// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibDisabled } from "libraries/utils/LibDisabled.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibTokenPortal } from "libraries/LibTokenPortal.sol";

uint256 constant ID = uint256(keccak256("system.erc20.portal"));

/// @notice System for bridging in ERC20 tokens into the game world (as an item).
/** @dev
 * A special system, uses local storage as the source of truth to avoid depending
 * on item registries. Not meant to be upgraded frequently, but can be if needed.
 */
contract TokenPortalSystem is System, AuthRoles {
  // store item's token address/conversion rate locally, no dependence on registries
  mapping(uint32 => address) public itemAddrs;
  mapping(uint32 => int32) public itemScales;

  constructor(IWorld _world, address _components) System(_world, _components) {}

  /// @notice deposit ERC20 tokens into the game world through the token portal
  /// @dev conversion scale is determined by itemScales
  function deposit(uint32 itemIndex, uint256 itemAmt) public {
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
  function withdraw(uint32 itemIndex, uint256 itemAmt) public returns (uint256 receiptID) {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // checks
    address tokenAddr = itemAddrs[itemIndex];
    require(tokenAddr != address(0), "Token Portal: item not registered");

    // reduces items, creates withdrawal receipt
    int32 scale = itemScales[itemIndex];
    receiptID = LibTokenPortal.withdraw(
      world,
      components,
      accID,
      itemIndex,
      itemAmt,
      tokenAddr,
      scale
    );
    LibAccount.updateLastTs(components, accID);
  }

  /// @notice execute a pending Withdrawal Receipt; must be owner
  /// @dev data logging may be wrong if itemScales entry is deleted,
  /// but token amounts and claim flow should resolve correctly
  function claim(uint256 receiptID) public {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    LibTokenPortal.verifyReceiptOwner(components, accID, receiptID);
    LibDisabled.verifyEnabled(components, receiptID);
    LibTokenPortal.verifyTimeEnd(components, receiptID);

    uint32 itemIndex = LibItem.getIndex(components, receiptID);
    require(itemIndex != 0, "Item Registry: item not registered");

    int32 scale = itemScales[itemIndex];
    LibTokenPortal.claim(world, components, receiptID, scale);
    LibAccount.updateLastTs(components, accID);
  }

  /// @notice cancel a pending Withdrawal Receipt; must be owner
  /// @dev data logging may be wrong if itemScales entry is deleted,
  /// but token amounts and claim flow should resolve correctly
  function cancel(uint256 receiptID) public {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    LibTokenPortal.verifyReceiptOwner(components, accID, receiptID);
    LibDisabled.verifyEnabled(components, receiptID);

    uint32 itemIndex = LibItem.getIndex(components, receiptID);
    require(itemIndex != 0, "Item Registry: item not registered");

    int32 scale = itemScales[itemIndex];
    LibTokenPortal.cancel(world, components, receiptID, scale);
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
  /// @dev item needs to be added through the ItemRegistrySystem first
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
  // MISC

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
