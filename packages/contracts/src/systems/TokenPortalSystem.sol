// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibTokenPortal } from "libraries/LibTokenPortal.sol";

uint256 constant ID = uint256(keccak256("system.erc20.portal"));

/// @notice System for bridging in ERC20 tokens into the game world (as an item).
/** @dev
 * A special system, uses local storage to avoid depending on item registries.
 * Not meant to be upgraded, but can be if needed.
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
    require(tokenAddr != address(0), "item not registered");

    // pull tokens and increase itemIndex balance (balance check is intrinsic)
    int32 scale = itemScales[itemIndex];
    LibTokenPortal.deposit(world, components, accID, itemIndex, tokenAddr, itemAmt, scale);
    LibAccount.updateLastTs(components, accID);
  }

  /// @notice withdraw ERC20 tokens out of the game world through the token portal
  /// @dev creates a Withdrawal Receipt entity to delay settlement
  function initWithdraw(uint32 itemIndex, uint256 itemAmt) public returns (uint256 receiptID) {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // checks
    address tokenAddr = itemAddrs[itemIndex];
    require(tokenAddr != address(0), "item not registered");

    // reduces items, creates withdrawal receipt
    int32 scale = itemScales[itemIndex];
    receiptID = LibTokenPortal.initWithdraw(
      world,
      components,
      accID,
      itemIndex,
      tokenAddr,
      itemAmt,
      scale
    );
    LibAccount.updateLastTs(components, accID);
  }

  /// @notice executes withdraw if min time has passed
  /// @dev can be executed by anyone. do we actually want this behavior?
  function claim(uint256 receiptID) public {
    LibTokenPortal.verifyTimeEnd(components, receiptID);
    LibTokenPortal.executeWithdraw(world, components, receiptID);
  }

  /// @dev only can be cancelled by receipt owner
  function cancel(uint256 receiptID) public {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    LibTokenPortal.verifyReceiptOwner(components, accID, receiptID); // checks
    LibTokenPortal.cancelWithdraw(world, components, receiptID); // also logs cancellation
    LibAccount.updateLastTs(components, accID); // account logging
  }

  function adminBlock(uint256 receiptID) public onlyAdmin(components) {
    LibTokenPortal.cancelWithdraw(world, components, receiptID);
  }

  //////////////////
  // REGISTRY

  // add an item to the token portal by populating its address and conversion scale
  // NOTE: item needs to be added through the ItemRegistrySystem first
  function setItem(uint32 index, address tokenAddr, int32 scale) public onlyOwner {
    require(LibItem.getByIndex(components, index) != 0, "TokenPortal: item does not exist");
    require(scale < 18, "TokenPortal: scale > 18 not supported");
    require(scale > 0, "TokenPortal: negative scale not supported");
    LibItem.setERC20(components, index, tokenAddr, scale);
    itemAddrs[index] = tokenAddr;
    itemScales[index] = scale;
  }

  // remove an item from the token portal
  function unsetItem(uint32 index) public onlyOwner {
    require(LibItem.getByIndex(components, index) != 0, "TokenPortal: item does not exist");
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
