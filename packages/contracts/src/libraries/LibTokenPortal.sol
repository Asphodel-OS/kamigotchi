// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { IndexItemComponent, ID as ItemIndexCompID } from "components/IndexItemComponent.sol";
import { IDOwnsWithdrawalComponent as OwnerComponent, ID as OwnerCompID } from "components/IDOwnsWithdrawalComponent.sol";
import { IsDisabledComponent, ID as IsDisabledCompID } from "components/IsDisabledComponent.sol";
import { TaxComponent, ID as TaxCompID } from "components/TaxComponent.sol";
import { TokenAddressComponent, ID as TokenAddrCompID } from "components/TokenAddressComponent.sol";
import { TokenHolderComponent, ID as TokenHolderCompID } from "components/TokenHolderComponent.sol";
import { TimeEndComponent, ID as TimeEndCompID } from "components/TimeEndComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibERC20 } from "libraries/utils/LibERC20.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory } from "libraries/LibInventory.sol";

uint256 constant taxRateUnits = 1e4;
uint256 constant RESERVE_ACC = uint256(uint160(0x3d7f111B3b69C657624b8633a997A56300212872)); // asphodel cold wallet account

/** @notice lib for ERC20 bridging and timelocks
 *
 * User flow TokenPortalSystem deposit():
 *  1. User calls deposit() with (itemIndex, amount)
 *  2. checks if item is registered with the portal (can be deposited)
 *  3. pulls associated ERC20 from user via TokenAllowanceComp, stores in TokenHolderComp
 *  4. increments user inventory balance accordingly (after accounting for import tax)
 *  5. log deposit details, emit event
 *
 * User flow TokenPortalSystem withdraw():
 *  1. User calls withdraw() with (itemIndex, amount)
 *  2. check if item can be withdrawn
 *  3. decrement inventory
 *  4. create a pending withdrawal Receipt with details
 *  5. log withdrawal details, emit event
 *  - withdrawal delay - (admins can pause or cancel outstanding Receipts)
 *  1. User calls WithdrawSystem with ReceiptID
 *  2. check if withdrawal delay has ended. remove if so
 *  3. send ERC20 from TokenHolderComp to user
 *  4. log withdraw action, emit event
 *
 * Shapes:
 *  Receipt: ID = new entity ID
 *   - IDOwnsWithdrawal (owner address)
 *   - ItemIndex
 *   - TokenAddress (must match itemIndex upon inventory increase actions)
 *   - Value (token amount being withdrawn)
 *   - Tax (tax being collected, denominated in units of item)
 *   - StartTime
 *   - EndTime
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
    uint256 taxAmt, // in item units
    uint256 endTime
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();

    LibEntityType.set(comps, id, "TOKEN_RECEIPT");
    OwnerComponent(getAddrByID(comps, OwnerCompID)).set(id, accID);
    IndexItemComponent(getAddrByID(comps, ItemIndexCompID)).set(id, itemIndex);
    TokenAddressComponent(getAddrByID(comps, TokenAddrCompID)).set(id, tokenAddr);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, tokenAmt);
    TaxComponent(getAddrByID(comps, TaxCompID)).set(id, taxAmt); // here if we ever want to support tax refunds
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).set(id, block.timestamp);
    TimeEndComponent(getAddrByID(comps, TimeEndCompID)).set(id, endTime);
  }

  function removeReceipt(IUintComp comps, uint256 id) internal {
    LibEntityType.remove(comps, id);
    OwnerComponent(getAddrByID(comps, OwnerCompID)).remove(id);
    IndexItemComponent(getAddrByID(comps, ItemIndexCompID)).remove(id);
    TokenAddressComponent(getAddrByID(comps, TokenAddrCompID)).remove(id);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(id);
    TaxComponent(getAddrByID(comps, TaxCompID)).remove(id);
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
  ) public {
    // determine amount of tax to be collected
    uint256 taxAmt = calcImportTax(comps, itemAmt);
    require(taxAmt < itemAmt, "TokenPortal: tax exceeds item amount");

    address accAddr = LibAccount.getOwner(comps, accID);
    uint256 tokenAmt = LibERC20.toTokenUnits(itemAmt, scale); // scaling accordingly

    // transfer tokens and increase inventory
    LibERC20.transfer(comps, tokenAddr, accAddr, getAddrByID(comps, TokenHolderCompID), tokenAmt);
    LibInventory._incFor(comps, accID, itemIndex, itemAmt - taxAmt);
    LibInventory._incFor(comps, RESERVE_ACC, itemIndex, taxAmt); // send tax to reserve

    // logging
    LogData memory logData = LogData(accID, itemIndex, itemAmt, taxAmt, tokenAddr, tokenAmt);
    logDeposit(comps, logData);
    emitDeposit(world, logData);
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
  ) public returns (uint256 receiptID) {
    // determine amount of tax to be collected
    uint256 taxAmt = calcExportTax(comps, itemAmt);
    require(taxAmt < itemAmt, "TokenPortal: tax exceeds item amount");

    uint256 tokenAmt = LibERC20.toTokenUnits(itemAmt - taxAmt, scale); // scaling accordingly
    uint256 endTime = block.timestamp + calcWithdrawalDelay(comps);

    // create receipt and decrease inventory
    receiptID = createReceipt(world, comps, accID, itemIndex, tokenAddr, tokenAmt, taxAmt, endTime);
    LibInventory._decFor(comps, accID, itemIndex, itemAmt);
    LibInventory._incFor(comps, RESERVE_ACC, itemIndex, taxAmt); // send tax to reserve

    // logging
    LogData memory logData = LogData(accID, itemIndex, itemAmt, taxAmt, tokenAddr, tokenAmt);
    logWithdraw(comps, logData);
    emitWithdraw(world, receiptID, logData);
  }

  /// @notice execute a pending Withdrawal Receipt to claim tokens
  /// @dev tax already handled
  function claim(IWorld world, IUintComp comps, uint256 receiptID, int32 scale) public {
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
    LogData memory logData = LogData(accID, itemIndex, itemAmt, 0, tokenAddr, tokenAmt);
    logClaim(comps, logData);
    emitClaim(world, accID, receiptID);
  }

  /// @notice cancel a pending Withdrawal Receipt, return items
  /// @dev no refund on export tax
  function cancel(IWorld world, IUintComp comps, uint256 receiptID, int32 scale) public {
    uint256 accID = OwnerComponent(getAddrByID(comps, OwnerCompID)).get(receiptID);
    address tokenAddr = TokenAddressComponent(getAddrByID(comps, TokenAddrCompID)).get(receiptID);
    uint256 tokenAmt = ValueComponent(getAddrByID(comps, ValueCompID)).get(receiptID);
    uint32 itemIndex = IndexItemComponent(getAddrByID(comps, ItemIndexCompID)).get(receiptID);
    uint256 itemAmt = LibERC20.toGameUnits(tokenAmt, scale);

    // put items back in world and clear receipt
    LibInventory._incFor(comps, accID, itemIndex, itemAmt);
    removeReceipt(comps, receiptID);

    // logging
    LogData memory logData = LogData(accID, itemIndex, itemAmt, 0, tokenAddr, tokenAmt);
    logCancel(comps, logData);
    emitCancel(world, accID, receiptID);
  }

  ///////////////
  // CALCULATIONS

  /// @notice get the delay for a Withdrawal Receipt
  /// @dev hardcoded for now. change to dynamic later
  function calcWithdrawalDelay(IUintComp comps) internal view returns (uint256) {
    return LibConfig.get(comps, "PORTAL_TOKEN_EXPORT_DELAY");
  }

  /// @notice get the tax amount for a Withdrawal (amt * taxRate + flatTax)
  /// @dev this is determined against the target item quantity being withdrawn
  function calcExportTax(IUintComp comps, uint256 amt) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(comps, "PORTAL_ITEM_EXPORT_TAX");
    uint32 flatTax = config[0];
    uint32 taxRate = config[1];
    return (amt * taxRate) / taxRateUnits + flatTax;
  }

  /// @notice get the tax amount for a Deposit
  /// @dev this is determined against the resulting item quantity from a deposit
  function calcImportTax(IUintComp comps, uint256 amt) internal view returns (uint256) {
    uint32[8] memory config = LibConfig.getArray(comps, "PORTAL_ITEM_IMPORT_TAX");
    uint32 flatTax = config[0];
    uint32 taxRate = config[1];
    return (amt * taxRate) / taxRateUnits + flatTax;
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

  /////////////////
  // LOGGING

  /// @notice Deposit/Withdraw data logging details
  struct LogData {
    uint256 accID; // account ID
    uint32 itemIndex; // item index
    uint256 itemAmt; // item amount
    uint256 taxAmt; // tax amount
    address token; // token address
    uint256 tokenAmt; // token amount
  }

  /// @notice logs deposits data
  function logDeposit(IUintComp comps, LogData memory data) internal {
    // logging account and world item totals
    uint256[] memory holders = new uint256[](2);
    holders[0] = data.accID;
    LibData.inc(comps, holders, data.itemIndex, "PORTAL_ITEM_TAX_TOTAL", data.taxAmt);
    LibData.inc(comps, holders, data.itemIndex, "PORTAL_ITEM_DEPOSIT_TOTAL", data.itemAmt);
    LibData.inc(
      comps,
      uint256(uint160(data.token)),
      0,
      "PORTAL_TOKEN_DEPOSIT_TOTAL",
      data.tokenAmt
    );

    // emit event
    // LibEmitter.emitEvent(world, "ERC20_DEPOSIT", _eventSchema(), abi.encode(data));
  }

  /// @notice logs pending withdrawal data
  function logWithdraw(IUintComp comps, LogData memory data) internal {
    // logging account and world item totals
    uint256[] memory holders = new uint256[](2);
    holders[0] = data.accID;
    LibData.inc(comps, holders, data.itemIndex, "PORTAL_ITEM_TAX_TOTAL", data.taxAmt);
    LibData.inc(comps, holders, data.itemIndex, "PORTAL_ITEM_WITHDRAW_TOTAL", data.itemAmt);
    LibData.inc(
      comps,
      uint256(uint160(data.token)),
      0,
      "PORTAL_TOKEN_WITHDRAW_TOTAL",
      data.tokenAmt
    );

    // emit event
    // LibEmitter.emitEvent(world, "ERC20_WITHDRAW_INIT", _eventSchema(), abi.encode(data));
  }

  /// @notice logs canceled withdrawal data
  function logCancel(IUintComp comps, LogData memory data) internal {
    // logging account and world item totals
    uint256[] memory holders = new uint256[](2);
    holders[0] = data.accID;
    LibData.inc(comps, holders, data.itemIndex, "PORTAL_ITEM_CANCEL_TOTAL", data.itemAmt);
    LibData.inc(comps, uint256(uint160(data.token)), 0, "PORTAL_TOKEN_CANCEL_TOTAL", data.tokenAmt);
  }

  /// @notice logs withdrawal data
  function logClaim(IUintComp comps, LogData memory data) internal {
    // logging account and world item totals
    uint256[] memory holders = new uint256[](2);
    holders[0] = data.accID;
    LibData.inc(comps, holders, data.itemIndex, "PORTAL_ITEM_CLAIM_TOTAL", data.itemAmt);
    LibData.inc(comps, uint256(uint160(data.token)), 0, "PORTAL_TOKEN_CLAIM_TOTAL", data.tokenAmt);
  }

  /////////////////
  // EVENTS

  /// @notice emit a Deposit event
  function emitDeposit(IWorld world, LogData memory data) internal {
    uint8[] memory _schema = new uint8[](7);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // ts
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // accID
    _schema[2] = uint8(LibTypes.SchemaValue.UINT32); // item index
    _schema[3] = uint8(LibTypes.SchemaValue.UINT256); // item amt
    _schema[4] = uint8(LibTypes.SchemaValue.UINT256); // tax amt
    _schema[5] = uint8(LibTypes.SchemaValue.ADDRESS); // token
    _schema[6] = uint8(LibTypes.SchemaValue.UINT256); // token amt

    LibEmitter.emitEvent(
      world,
      "PORTAL_TOKEN_DEPOSIT",
      _schema,
      abi.encode(
        block.timestamp,
        data.accID,
        data.itemIndex,
        data.itemAmt,
        data.taxAmt,
        data.token,
        data.tokenAmt
      )
    );
  }

  /// @notice emit a Withdrawal event
  function emitWithdraw(IWorld world, uint256 receiptID, LogData memory data) internal {
    uint8[] memory _schema = new uint8[](8);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // ts
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // accID
    _schema[2] = uint8(LibTypes.SchemaValue.UINT256); // receiptID
    _schema[3] = uint8(LibTypes.SchemaValue.UINT32); // item index
    _schema[4] = uint8(LibTypes.SchemaValue.UINT256); // item amt
    _schema[5] = uint8(LibTypes.SchemaValue.UINT256); // tax amt
    _schema[6] = uint8(LibTypes.SchemaValue.ADDRESS); // token
    _schema[7] = uint8(LibTypes.SchemaValue.UINT256); // token amt

    LibEmitter.emitEvent(
      world,
      "PORTAL_TOKEN_WITHDRAW",
      _schema,
      abi.encode(
        block.timestamp,
        data.accID,
        receiptID,
        data.itemIndex,
        data.itemAmt,
        data.taxAmt,
        data.token,
        data.tokenAmt
      )
    );
  }

  /// @notice emit a Claim event
  function emitClaim(IWorld world, uint256 accID, uint256 receiptID) internal {
    uint8[] memory _schema = new uint8[](3);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // ts
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // accID
    _schema[2] = uint8(LibTypes.SchemaValue.UINT256); // receiptID

    LibEmitter.emitEvent(
      world,
      "PORTAL_TOKEN_CLAIM",
      _schema,
      abi.encode(block.timestamp, accID, receiptID)
    );
  }

  /// @notice emit a Cancelation event
  function emitCancel(IWorld world, uint256 accID, uint256 receiptID) internal {
    uint8[] memory _schema = new uint8[](3);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // ts
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // accID
    _schema[2] = uint8(LibTypes.SchemaValue.UINT256); // receiptID

    LibEmitter.emitEvent(
      world,
      "PORTAL_TOKEN_CANCEL",
      _schema,
      abi.encode(block.timestamp, accID, receiptID)
    );
  }
}
