// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { IndexItemComponent, ID as ItemIndexCompID } from "components/IndexItemComponent.sol";
import { IDOwnsWithdrawalComponent as OwnerComponent, ID as OwnerCompID } from "components/IDOwnsWithdrawalComponent.sol";
import { ScaleComponent, ID as ScaleCompID } from "components/ScaleComponent.sol";
import { TokenAddressComponent, ID as TokenAddressCompID } from "components/TokenAddressComponent.sol";
import { TokenHolderComponent, ID as TokenHolderCompID } from "components/TokenHolderComponent.sol";
import { TimeEndComponent, ID as TimeEndCompID } from "components/TimeEndComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibERC20 } from "libraries/utils/LibERC20.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibInventory } from "libraries/LibInventory.sol";

/** @notice lib for ERC20 bridging and timelocks
 *
 * User flow (deposit):
 *  1. User calls DepositSystem with (itemIndex, amount)
 *  2. DepositSystem checks if item can be deposited
 *  3. DepositSystem pulls ERC20 from user via TokenAllowanceComp, stores in TokenHolderComp
 *  4. DepositSystem logs deposit, emit event
 *
 * User flow (withdraw):
 *  1. User calls WithdrawSystem with (itemIndex, amount)
 *  2. WithdrawSystem checks if item can be withdrawn
 *  3. WithdrawSystem creates an Receipt
 *  4. WithdrawSystem removes items
 *  5. Emit initiateWithdraw event
 *  - withdrawal delay - (admins can block tx)
 *  1. Anyone calls WithdrawSystem with ReceiptID
 *  2. WithdrawSystem checks if withdrawal delay has ended. remove if so
 *  3. WithdrawSystem sends ERC20 from TokenHolderComp to user
 *  4. WithdrawSystem logs withdraw, emit event
 *
 * Shapes:
 *  Receipt: ID = new entity ID
 *   - IDOwnsWithdrawal (owner address)
 *   - itemIndex
 *   - tokenAddress (must match itemIndex upon inventory increase actions)
 *   - Value (tokenAmt of)
 *   - endTime
 */
library LibTokenBridge {
  ///////////////
  // SHAPES

  function createReceipt(
    IWorld world,
    IUintComp comps,
    uint256 holderID,
    uint32 itemIndex,
    address tokenAddr,
    uint256 amount,
    int32 scale,
    uint256 endTime
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();

    LibEntityType.set(comps, id, "TOKEN_RECEIPT");
    OwnerComponent(getAddrByID(comps, OwnerCompID)).set(id, holderID);
    IndexItemComponent(getAddrByID(comps, ItemIndexCompID)).set(id, itemIndex);
    TokenAddressComponent(getAddrByID(comps, TokenAddressCompID)).set(id, tokenAddr);
    ScaleComponent(getAddrByID(comps, ScaleCompID)).set(id, scale);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, amount);
    TimeEndComponent(getAddrByID(comps, TimeEndCompID)).set(id, endTime);
  }

  function removeReceipt(IUintComp comps, uint256 id) internal {
    LibEntityType.remove(comps, id);
    OwnerComponent(getAddrByID(comps, OwnerCompID)).remove(id);
    IndexItemComponent(getAddrByID(comps, ItemIndexCompID)).remove(id);
    TokenAddressComponent(getAddrByID(comps, TokenAddressCompID)).remove(id);
    ScaleComponent(getAddrByID(comps, ScaleCompID)).remove(id);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(id);
    TimeEndComponent(getAddrByID(comps, TimeEndCompID)).remove(id);
  }

  /////////////////
  // INTERACTIONS

  function depositERC20(
    IUintComp comps,
    uint256 accID,
    address tokenAddr,
    uint256 itemAmt,
    int32 scale
  ) internal {
    address accAddr = LibAccount.getOwner(comps, accID);

    // pulling token
    uint256 tokenAmt = LibERC20.toTokenUnits(itemAmt, scale); // scaling accordingly
    LibERC20.transfer(comps, tokenAddr, accAddr, getAddrByID(comps, TokenHolderCompID), tokenAmt);
  }

  function initiateWithdraw(
    IWorld world,
    IUintComp comps,
    uint256 accID,
    uint32 itemIndex,
    address tokenAddr,
    uint256 itemAmt,
    int32 scale
  ) internal returns (uint256 receiptID) {
    uint256 tokenAmt = LibERC20.toTokenUnits(itemAmt, scale); // scaling accordingly
    uint256 endTime = block.timestamp + getWithdrawDelay(comps);

    // creating receipt and withdrawal receipt
    receiptID = createReceipt(world, comps, accID, itemIndex, tokenAddr, tokenAmt, scale, endTime);

    // sending items to receipt (tokens are considered not-in-world past this point)
    LibInventory._decFor(comps, accID, itemIndex, itemAmt);
  }

  function executeWithdraw(IWorld world, IUintComp comps, uint256 receiptID) internal {
    uint256 accID = OwnerComponent(getAddrByID(comps, OwnerCompID)).get(receiptID);
    uint32 item = IndexItemComponent(getAddrByID(comps, ItemIndexCompID)).get(receiptID);
    address token = TokenAddressComponent(getAddrByID(comps, TokenAddressCompID)).get(receiptID);
    uint256 tokenAmt = ValueComponent(getAddrByID(comps, ValueCompID)).get(receiptID);
    int32 scale = ScaleComponent(getAddrByID(comps, ScaleCompID)).get(receiptID);

    // send tokens to owner
    TokenHolderComponent walletComp = TokenHolderComponent(getAddrByID(comps, TokenHolderCompID));
    walletComp.withdraw(token, LibAccount.getOwner(comps, accID), tokenAmt);

    // clear receipt
    removeReceipt(comps, receiptID);

    // logging
    uint256 itemAmt = LibERC20.toGameUnits(tokenAmt, scale);
    logWithdraw(world, comps, LogData(accID, item, token, itemAmt, scale));
  }

  /// @dev can be initiated by admin or original user
  // tokenAddress = item's token address to be checked prior
  function cancelWithdraw(IWorld world, IUintComp comps, uint256 receiptID) internal {
    uint256 accID = OwnerComponent(getAddrByID(comps, OwnerCompID)).get(receiptID);
    uint32 item = IndexItemComponent(getAddrByID(comps, ItemIndexCompID)).get(receiptID);
    address token = TokenAddressComponent(getAddrByID(comps, TokenAddressCompID)).get(receiptID);
    uint256 tokenAmt = ValueComponent(getAddrByID(comps, ValueCompID)).get(receiptID);
    int32 scale = ScaleComponent(getAddrByID(comps, ScaleCompID)).get(receiptID);

    // put tokens back in world
    uint256 itemAmt = LibERC20.toGameUnits(tokenAmt, scale);
    LibInventory._incFor(comps, accID, item, itemAmt);

    // clear receipt
    removeReceipt(comps, receiptID);

    // logging
    logCancelWithdraw(world, comps, LogData(accID, item, token, itemAmt, scale));
  }

  ////////////////
  // CHECKERS

  function verifyBridgeable(IUintComp comps, uint32 itemIndex) internal view {
    // in practice uses the system's local mapping, check left here because it still should be correct
    if (LibItem.getTokenAddr(comps, itemIndex) == address(0)) revert("item has no linked token");
    if (LibItem.checkFlag(comps, itemIndex, "ERC20_BRIDGEABLE", false))
      revert("item cannot be bridged");
  }

  function verifyReceiptOwner(IUintComp comps, uint256 accID, uint256 receiptID) internal view {
    if (OwnerComponent(getAddrByID(comps, OwnerCompID)).get(receiptID) != accID)
      revert("not receipt owner");
  }

  function verifyTimeEnd(IUintComp comps, uint256 receiptID) internal view {
    uint256 endTime = TimeEndComponent(getAddrByID(comps, TimeEndCompID)).get(receiptID);
    if (block.timestamp < endTime) revert("withdrawal not ready");
  }

  ///////////////
  // GETTERS

  function getWithdrawDelay(IUintComp comps) internal view returns (uint256) {
    return LibConfig.get(comps, "ERC20_WITHDRAWAL_DELAY"); // todo: replace with dynamic OR hardcoded
  }

  /////////////////
  // LOGGING

  struct LogData {
    uint256 accID;
    uint32 item;
    address token;
    uint256 itemAmt;
    int32 scale;
  }

  function _eventSchema() internal pure returns (uint8[] memory _schema) {
    _schema = new uint8[](4);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // accID
    _schema[1] = uint8(LibTypes.SchemaValue.UINT32); // item
    _schema[2] = uint8(LibTypes.SchemaValue.ADDRESS); // token
    _schema[3] = uint8(LibTypes.SchemaValue.UINT256); // itemAmt
  }

  /// @notice logs deposits data
  function logDeposit(IWorld world, IUintComp comps, LogData memory data) internal {
    // logging account and world item totals
    uint256[] memory holders = new uint256[](2);
    holders[0] = data.accID;
    LibData.inc(comps, holders, data.item, "BRIDGE_ITEM_DEPOSIT_TOTAL", data.itemAmt);

    // logging world token totals
    uint256 amt = LibERC20.toTokenUnits(data.itemAmt, data.scale);
    LibData.inc(comps, uint256(uint160(data.token)), 0, "BRIDGE_TOKEN_DEPOSIT_TOTAL", amt);

    // emit event
    LibEmitter.emitEvent(world, "ERC20_DEPOSIT", _eventSchema(), abi.encode(data));
  }

  /// @notice logs pending withdrawals data
  function logPendingWithdraw(IWorld world, IUintComp comps, LogData memory data) internal {
    // logging account and world item totals
    uint256[] memory holders = new uint256[](2);
    holders[0] = data.accID;
    LibData.inc(comps, holders, data.item, "BRIDGE_ITEM_PENDING_WITHDRAW_TOTAL", data.itemAmt);

    // logging world token totals
    uint256 amt = LibERC20.toTokenUnits(data.itemAmt, data.scale);
    LibData.inc(comps, uint256(uint160(data.token)), 0, "BRIDGE_TOKEN_PENDING_WITHDRAW_TOTAL", amt);

    // emit event
    LibEmitter.emitEvent(world, "ERC20_PENDING_WITHDRAW", _eventSchema(), abi.encode(data));
  }

  /// @notice logs cancelled withdrawals data
  function logCancelWithdraw(IWorld world, IUintComp comps, LogData memory data) internal {
    // logging account and world item totals
    uint256[] memory holders = new uint256[](2);
    holders[0] = data.accID;
    LibData.inc(comps, holders, data.item, "BRIDGE_ITEM_CANCEL_WITHDRAW_TOTAL", data.itemAmt);

    // logging world token totals
    uint256 amt = LibERC20.toTokenUnits(data.itemAmt, data.scale);
    LibData.inc(comps, uint256(uint160(data.token)), 0, "BRIDGE_TOKEN_CANCEL_WITHDRAW_TOTAL", amt);

    // emit event
    LibEmitter.emitEvent(world, "ERC20_CANCEL_WITHDRAW", _eventSchema(), abi.encode(data));
  }

  /// @notice logs withdrawals data
  function logWithdraw(IWorld world, IUintComp comps, LogData memory data) internal {
    // logging account and world item totals
    uint256[] memory holders = new uint256[](2);
    holders[0] = data.accID;
    LibData.inc(comps, holders, data.item, "BRIDGE_ITEM_WITHDRAW_TOTAL", data.itemAmt);

    // logging world token totals
    uint256 amt = LibERC20.toTokenUnits(data.itemAmt, data.scale);
    LibData.inc(comps, uint256(uint160(data.token)), 0, "BRIDGE_TOKEN_WITHDRAW_TOTAL", amt);

    // emit event
    LibEmitter.emitEvent(world, "ERC20_WITHDRAW", _eventSchema(), abi.encode(data));
  }
}
