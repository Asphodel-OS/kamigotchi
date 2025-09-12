// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { IndexItemComponent, ID as ItemIndexCompID } from "components/IndexItemComponent.sol";
import { IDOwnsWithdrawalComponent as OwnerComponent, ID as OwnerCompID } from "components/IDOwnsWithdrawalComponent.sol";
import { TokenAddressComponent, ID as TokenAddrCompID } from "components/TokenAddressComponent.sol";
import { TokenHolderComponent, ID as TokenHolderCompID } from "components/TokenHolderComponent.sol";
import { TimeEndComponent, ID as TimeEndCompID } from "components/TimeEndComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibERC20 } from "libraries/utils/LibERC20.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
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
 *   - ItemIndex
 *   - TokenAddress (must match itemIndex upon inventory increase actions)
 *   - Scale (conversion scale token->item)
 *   - Value (tokenAmt of)
 *   - endTime
 */
library LibTokenPortal {
  ///////////////
  // SHAPES

  function createReceipt(
    IWorld world,
    IUintComp comps,
    uint256 accID,
    uint32 itemIndex,
    address tokenAddr,
    uint256 tokenAmt,
    uint256 endTime
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();

    LibEntityType.set(comps, id, "TOKEN_RECEIPT");
    OwnerComponent(getAddrByID(comps, OwnerCompID)).set(id, accID);
    IndexItemComponent(getAddrByID(comps, ItemIndexCompID)).set(id, itemIndex);
    TokenAddressComponent(getAddrByID(comps, TokenAddrCompID)).set(id, tokenAddr);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, tokenAmt);
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).set(id, block.timestamp);
    TimeEndComponent(getAddrByID(comps, TimeEndCompID)).set(id, endTime);
  }

  function removeReceipt(IUintComp comps, uint256 id) internal {
    LibEntityType.remove(comps, id);
    OwnerComponent(getAddrByID(comps, OwnerCompID)).remove(id);
    IndexItemComponent(getAddrByID(comps, ItemIndexCompID)).remove(id);
    TokenAddressComponent(getAddrByID(comps, TokenAddrCompID)).remove(id);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(id);
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).remove(id);
    TimeEndComponent(getAddrByID(comps, TimeEndCompID)).remove(id);
  }

  /////////////////
  // INTERACTIONS

  /// @notice deposit ERC20 tokens into the game world, converting to linked item
  function deposit(
    IWorld world,
    IUintComp comps,
    uint256 accID,
    uint32 itemIndex,
    uint256 itemAmt,
    address tokenAddr,
    int32 scale
  ) internal {
    address accAddr = LibAccount.getOwner(comps, accID);
    uint256 tokenAmt = LibERC20.toTokenUnits(itemAmt, scale); // scaling accordingly

    // transfer tokens and increase inventory
    LibERC20.transfer(comps, tokenAddr, accAddr, getAddrByID(comps, TokenHolderCompID), tokenAmt);
    LibInventory._incFor(comps, accID, itemIndex, itemAmt);

    // logging
    LogData memory logData = LogData(accID, itemIndex, itemAmt, tokenAddr, tokenAmt);
    logDeposit(world, comps, logData);
  }

  /// @notice initialize a token withdrawal, generating a pending Receipt
  function withdraw(
    IWorld world,
    IUintComp comps,
    uint256 accID,
    uint32 itemIndex,
    uint256 itemAmt,
    address tokenAddr,
    int32 scale
  ) internal returns (uint256 receiptID) {
    uint256 tokenAmt = LibERC20.toTokenUnits(itemAmt, scale); // scaling accordingly
    uint256 endTime = block.timestamp + getWithdrawDelay(comps);

    // create receipt and decrease inventory
    receiptID = createReceipt(world, comps, accID, itemIndex, tokenAddr, tokenAmt, endTime);
    LibInventory._decFor(comps, accID, itemIndex, itemAmt);

    // logging
    LogData memory logData = LogData(accID, itemIndex, itemAmt, tokenAddr, tokenAmt);
    logWithdraw(world, comps, logData);
  }

  /// @notice execute a pending Withdrawal Receipt to claim tokens
  function claim(IWorld world, IUintComp comps, uint256 receiptID, int32 scale) internal {
    uint256 accID = OwnerComponent(getAddrByID(comps, OwnerCompID)).get(receiptID);
    address tokenAddr = TokenAddressComponent(getAddrByID(comps, TokenAddrCompID)).get(receiptID);
    uint256 tokenAmt = ValueComponent(getAddrByID(comps, ValueCompID)).get(receiptID);
    uint32 itemIndex = IndexItemComponent(getAddrByID(comps, ItemIndexCompID)).get(receiptID);
    uint256 itemAmt = LibERC20.toGameUnits(tokenAmt, scale);

    // send tokens to owner and clear receipt
    TokenHolderComponent walletComp = TokenHolderComponent(getAddrByID(comps, TokenHolderCompID));
    walletComp.withdraw(tokenAddr, LibAccount.getOwner(comps, accID), tokenAmt);
    removeReceipt(comps, receiptID);

    // logging
    LogData memory logData = LogData(accID, itemIndex, itemAmt, tokenAddr, tokenAmt);
    logClaim(world, comps, logData);
  }

  /// @notice cancel a pending Withdrawal Receipt, return items
  function cancel(IWorld world, IUintComp comps, uint256 receiptID, int32 scale) internal {
    uint256 accID = OwnerComponent(getAddrByID(comps, OwnerCompID)).get(receiptID);
    address tokenAddr = TokenAddressComponent(getAddrByID(comps, TokenAddrCompID)).get(receiptID);
    uint256 tokenAmt = ValueComponent(getAddrByID(comps, ValueCompID)).get(receiptID);
    uint32 itemIndex = IndexItemComponent(getAddrByID(comps, ItemIndexCompID)).get(receiptID);
    uint256 itemAmt = LibERC20.toGameUnits(tokenAmt, scale);

    // put items back in world and clear receipt
    LibInventory._incFor(comps, accID, itemIndex, itemAmt);
    removeReceipt(comps, receiptID);

    // logging
    LogData memory logData = LogData(accID, itemIndex, itemAmt, tokenAddr, tokenAmt);
    logCancel(world, comps, logData);
  }

  ////////////////
  // CHECKERS

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

  /// @notice Deposit/Withdraw data logging details
  struct LogData {
    uint256 accID; // account ID
    uint32 item; // item index
    uint256 itemAmt; // item amount
    address token; // token address
    uint256 tokenAmt; // token amount
  }

  /// @notice logs deposits data
  function logDeposit(IWorld world, IUintComp comps, LogData memory data) internal {
    // logging account and world item totals
    uint256[] memory holders = new uint256[](2);
    holders[0] = data.accID;
    LibData.inc(comps, holders, data.item, "BRIDGE_ITEM_DEPOSIT_TOTAL", data.itemAmt);
    LibData.inc(
      comps,
      uint256(uint160(data.token)),
      0,
      "BRIDGE_TOKEN_DEPOSIT_TOTAL",
      data.tokenAmt
    );

    // emit event
    // LibEmitter.emitEvent(world, "ERC20_DEPOSIT", _eventSchema(), abi.encode(data));
  }

  /// @notice logs pending withdrawals data
  function logWithdraw(IWorld world, IUintComp comps, LogData memory data) internal {
    // logging account and world item totals
    uint256[] memory holders = new uint256[](2);
    holders[0] = data.accID;
    LibData.inc(comps, holders, data.item, "BRIDGE_ITEM_WITHDRAW_INIT_TOTAL", data.itemAmt);
    LibData.inc(
      comps,
      uint256(uint160(data.token)),
      0,
      "BRIDGE_TOKEN_WITHDRAW_INIT_TOTAL",
      data.tokenAmt
    );

    // emit event
    // LibEmitter.emitEvent(world, "ERC20_WITHDRAW_INIT", _eventSchema(), abi.encode(data));
  }

  /// @notice logs cancelled withdrawals data
  function logCancel(IWorld world, IUintComp comps, LogData memory data) internal {
    // logging account and world item totals
    uint256[] memory holders = new uint256[](2);
    holders[0] = data.accID;
    LibData.inc(comps, holders, data.item, "BRIDGE_ITEM_WITHDRAW_CANCEL_TOTAL", data.itemAmt);
    LibData.inc(
      comps,
      uint256(uint160(data.token)),
      0,
      "BRIDGE_TOKEN_WITHDRAW_CANCEL_TOTAL",
      data.tokenAmt
    );

    // emit event
    // LibEmitter.emitEvent(world, "ERC20_WITHDRAW_CANCEL", _eventSchema(), abi.encode(data));
  }

  /// @notice logs withdrawals data
  function logClaim(IWorld world, IUintComp comps, LogData memory data) internal {
    // logging account and world item totals
    uint256[] memory holders = new uint256[](2);
    holders[0] = data.accID;
    LibData.inc(comps, holders, data.item, "BRIDGE_ITEM_WITHDRAW_CLAIM_TOTAL", data.itemAmt);
    LibData.inc(
      comps,
      uint256(uint160(data.token)),
      0,
      "BRIDGE_TOKEN_WITHDRAW_CLAIM_TOTAL",
      data.tokenAmt
    );

    // emit event
    // LibEmitter.emitEvent(world, "ERC20_WITHDRAW_CLAIM", _eventSchema(), abi.encode(data));
  }

  /////////////////
  // EVENTS

  function _eventSchema() internal pure returns (uint8[] memory _schema) {
    _schema = new uint8[](5);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // ts
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // accID
    _schema[2] = uint8(LibTypes.SchemaValue.UINT32); // item
    _schema[3] = uint8(LibTypes.SchemaValue.ADDRESS); // token
    _schema[4] = uint8(LibTypes.SchemaValue.UINT256); // amt
  }
}
