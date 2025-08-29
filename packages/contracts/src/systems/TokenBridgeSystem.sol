// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibTokenBridge } from "libraries/LibTokenBridge.sol";

uint256 constant ID = uint256(keccak256("system.erc20.bridge"));

/// @notice System for bridging in ERC20 tokens into the game world (as an item).
/** @dev
 * A special system, uses local storage to avoid depending on item registries.
 * Not meant to be upgraded, but can be if needed.
 */
contract TokenBridgeSystem is System, AuthRoles {
  // stores item's token address locally, no dependence on item registries
  mapping(uint32 => address) public itemRegistry;

  constructor(IWorld _world, address _components) System(_world, _components) {}

  /// @dev uses itemAmt, where 1000 inGame = 1^18 ERC20 (with 18 decimals)
  function deposit(uint32 itemIndex, uint256 itemAmt) public {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // checks before action
    address tokenAddr = itemRegistry[itemIndex];
    require(tokenAddr != address(0), "item not registered");
    LibTokenBridge.verifyBridgeable(components, itemIndex);

    // pull tokens and increase itemIndex balance (balance check is intrinsic)
    LibTokenBridge.depositERC20(components, accID, tokenAddr, itemAmt);
    LibInventory._incFor(components, accID, itemIndex, itemAmt);

    // logging
    LibTokenBridge.LogData memory logData = LibTokenBridge.LogData(
      accID,
      itemIndex,
      tokenAddr,
      itemAmt
    );
    LibTokenBridge.logDeposit(world, components, logData);
    LibAccount.updateLastTs(components, accID);
  }

  /// @dev uses itemAmt, where 1000 inGame = 1^18 ERC20 (with 18 decimals)
  function initiateWithdraw(uint32 itemIndex, uint256 itemAmt) public returns (uint256 receiptID) {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // checks
    address tokenAddr = itemRegistry[itemIndex];
    require(tokenAddr != address(0), "item not registered");
    LibTokenBridge.verifyBridgeable(components, itemIndex);

    // reduces items, creates withdrawal receipt
    receiptID = LibTokenBridge.initiateWithdraw(
      world,
      components,
      accID,
      itemIndex,
      tokenAddr,
      itemAmt
    );

    // logging
    LibTokenBridge.LogData memory logData = LibTokenBridge.LogData(
      accID,
      itemIndex,
      tokenAddr,
      itemAmt
    );
    LibTokenBridge.logPendingWithdraw(world, components, logData);
    LibAccount.updateLastTs(components, accID);
  }

  /// @notice executes withdraw if min time has passed
  /// @dev can be executed by anyone
  function claim(uint256 receiptID) public {
    LibTokenBridge.verifyTimeEnd(components, receiptID);
    LibTokenBridge.executeWithdraw(world, components, receiptID);
  }

  /// @dev only can be cancelled by receipt owner
  function cancel(uint256 receiptID) public {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    // checks
    LibTokenBridge.verifyReceiptOwner(components, accID, receiptID);

    // cancel withdrawal
    LibTokenBridge.cancelWithdraw(world, components, receiptID); // also logs cancellation

    // logging
    LibAccount.updateLastTs(components, accID);
  }

  function adminBlock(uint256 receiptID) public onlyAdmin(components) {
    LibTokenBridge.cancelWithdraw(world, components, receiptID);
  }

  //////////////////
  // REGISTRY

  function addItem(uint32 index, address tokenAddr) public onlyOwner {
    itemRegistry[index] = tokenAddr;
  }

  function removeItem(uint32 index) public onlyOwner {
    delete itemRegistry[index];
  }

  //////////////////
  // MISC

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
