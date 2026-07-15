// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IDTypeComponent, ID as IDTypeCompID } from "components/IDTypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { FixedPointMathLib } from "utils/FixedPointMathLib.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibData } from "libraries/LibData.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPoolRegistry as LibRegistry } from "libraries/LibPoolRegistry.sol";

uint256 constant BPS_DENOMINATOR = 10000;

/** @notice
 * LibPool handles all runtime interactions with Pools: swaps and liquidity
 * provision. Constant-product (x*y=k) semantics with the swap fee accruing
 * to reserves (LPs earn it pro-rata on burn). Total LP supply lives in the
 * pool entity's Value component (its fee sits in Rate — see LibPoolRegistry).
 *
 * All rounding floors in the pool's favor, so k never decreases.
 *
 * LP Share entities are shaped as follows:
 *  - EntityType: POOL_SHARE
 *  - IdHolder: the account holding the position (or the pool itself, for locked shares)
 *  - IDType: the pool
 *  - Value: the share balance
 */
library LibPool {
  /////////////////
  // ACTIONS

  /// @notice swap an exact amount of one pool item for the other
  function swap(
    IUintComp comps,
    uint256 poolID,
    uint256 accID,
    uint32 indexIn,
    uint32 indexOut,
    uint256 amountIn,
    uint256 minAmountOut
  ) public returns (uint256 amountOut) {
    require(amountIn > 0, "Pool: zero input");

    uint256 reserveIn = LibInventory.getBalanceOf(comps, poolID, indexIn);
    uint256 reserveOut = LibInventory.getBalanceOf(comps, poolID, indexOut);
    amountOut = calcAmountOut(amountIn, reserveIn, reserveOut, LibRegistry.getFeeBps(comps, poolID));
    require(amountOut > 0, "Pool: insufficient output");
    require(amountOut >= minAmountOut, "Pool: slippage exceeded");

    LibInventory.transferForNoLog(comps, accID, poolID, indexIn, amountIn); // implicit balance check
    LibInventory.transferForNoLog(comps, poolID, accID, indexOut, amountOut);
  }

  struct AddLiqParams {
    uint32 indexA;
    uint32 indexB;
    uint256 amountADesired;
    uint256 amountBDesired;
    uint256 amountAMin;
    uint256 amountBMin;
  }

  /// @notice deposit both pool items at the current reserve ratio, minting LP shares
  /// @dev settles between desired/min bounds like the UniswapV2 router
  function addLiquidity(
    IUintComp comps,
    uint256 poolID,
    uint256 accID,
    AddLiqParams memory p
  ) public returns (uint256 amtA, uint256 amtB, uint256 liquidity) {
    uint256 reserveA = LibInventory.getBalanceOf(comps, poolID, p.indexA);
    uint256 reserveB = LibInventory.getBalanceOf(comps, poolID, p.indexB);

    uint256 amountBOptimal = quote(p.amountADesired, reserveA, reserveB);
    if (amountBOptimal <= p.amountBDesired) {
      require(amountBOptimal >= p.amountBMin, "Pool: insufficient B amount");
      (amtA, amtB) = (p.amountADesired, amountBOptimal);
    } else {
      uint256 amountAOptimal = quote(p.amountBDesired, reserveB, reserveA);
      // guaranteed by quote()'s floor; assert like the UniswapV2 router so a
      // rounding edge-case reverts instead of overspending the caller's A
      require(amountAOptimal <= p.amountADesired, "Pool: excessive A amount");
      require(amountAOptimal >= p.amountAMin, "Pool: insufficient A amount");
      (amtA, amtB) = (amountAOptimal, p.amountBDesired);
    }

    uint256 supply = getTotalSupply(comps, poolID);
    // 512-bit mulDiv: amt × supply may exceed 2^256 at extreme scales
    liquidity = min(
      FixedPointMathLib.mulDivDown(amtA, supply, reserveA),
      FixedPointMathLib.mulDivDown(amtB, supply, reserveB)
    );
    require(liquidity > 0, "Pool: insufficient liquidity minted");

    mintShares(comps, poolID, accID, liquidity);
    LibInventory.transferForNoLog(comps, accID, poolID, p.indexA, amtA); // implicit balance check
    LibInventory.transferForNoLog(comps, accID, poolID, p.indexB, amtB);
  }

  struct RemoveLiqParams {
    uint32 indexA;
    uint32 indexB;
    uint256 shares;
    uint256 amountAMin;
    uint256 amountBMin;
  }

  /// @notice burn LP shares for a pro-rata slice of both reserves
  function removeLiquidity(
    IUintComp comps,
    uint256 poolID,
    uint256 accID,
    RemoveLiqParams memory p
  ) public returns (uint256 amtA, uint256 amtB) {
    require(p.shares > 0, "Pool: zero shares");

    uint256 supply = getTotalSupply(comps, poolID);
    amtA = FixedPointMathLib.mulDivDown(p.shares, LibInventory.getBalanceOf(comps, poolID, p.indexA), supply);
    amtB = FixedPointMathLib.mulDivDown(p.shares, LibInventory.getBalanceOf(comps, poolID, p.indexB), supply);
    // OR, not AND: at game-scale integers a small position in a skewed pool
    // floors one side to 0. requiring both > 0 would freeze it forever, so an
    // exit is allowed as long as SOME value is recoverable (the zero side is
    // genuinely worth ~0 and is forfeited).
    require(amtA > 0 || amtB > 0, "Pool: insufficient liquidity burned");
    require(amtA >= p.amountAMin && amtB >= p.amountBMin, "Pool: slippage exceeded");

    burnShares(comps, poolID, accID, p.shares); // implicit share balance check
    LibInventory.transferForNoLog(comps, poolID, accID, p.indexA, amtA);
    LibInventory.transferForNoLog(comps, poolID, accID, p.indexB, amtB);
  }

  /////////////////
  // SHARES

  /// @notice mint LP shares to a holder, creating the position entity if needed
  function mintShares(IUintComp comps, uint256 poolID, uint256 holderID, uint256 amt) internal {
    uint256 shareID = genShareID(poolID, holderID);
    bool has = LibEntityType.checkAndSet(comps, shareID, "POOL_SHARE");
    if (!has) {
      IdHolderComponent(getAddrByID(comps, IdHolderCompID)).set(shareID, holderID);
      IDTypeComponent(getAddrByID(comps, IDTypeCompID)).set(shareID, poolID);
    }
    ValueComponent(getAddrByID(comps, ValueCompID)).inc(shareID, amt);
    ValueComponent(getAddrByID(comps, ValueCompID)).inc(poolID, amt); // total supply on the pool
  }

  /// @notice burn LP shares from a holder, deleting the position entity at 0
  /// @dev the pool's own (locked) shares can never be burned
  function burnShares(IUintComp comps, uint256 poolID, uint256 holderID, uint256 amt) internal {
    require(holderID != poolID, "Pool: shares locked");
    uint256 shareID = genShareID(poolID, holderID);

    ValueComponent valComp = ValueComponent(getAddrByID(comps, ValueCompID));
    uint256 newBal = valComp.safeGet(shareID) - amt; // implicit balance check
    if (newBal == 0) {
      LibEntityType.remove(comps, shareID);
      IdHolderComponent(getAddrByID(comps, IdHolderCompID)).remove(shareID);
      IDTypeComponent(getAddrByID(comps, IDTypeCompID)).remove(shareID);
      valComp.remove(shareID);
    } else valComp.set(shareID, newBal);
    valComp.dec(poolID, amt); // total supply on the pool
  }

  /// @notice clear the pool's own locked shares; only used during pool removal
  function burnLockedShares(IUintComp comps, uint256 poolID) internal {
    uint256 shareID = genShareID(poolID, poolID);
    ValueComponent valComp = ValueComponent(getAddrByID(comps, ValueCompID));
    uint256 bal = valComp.safeGet(shareID);

    LibEntityType.remove(comps, shareID);
    IdHolderComponent(getAddrByID(comps, IdHolderCompID)).remove(shareID);
    IDTypeComponent(getAddrByID(comps, IDTypeCompID)).remove(shareID);
    valComp.remove(shareID);
    valComp.dec(poolID, bal); // total supply on the pool
  }

  function getShares(
    IUintComp comps,
    uint256 poolID,
    uint256 holderID
  ) internal view returns (uint256) {
    return ValueComponent(getAddrByID(comps, ValueCompID)).safeGet(genShareID(poolID, holderID));
  }

  function getTotalSupply(IUintComp comps, uint256 poolID) internal view returns (uint256) {
    return ValueComponent(getAddrByID(comps, ValueCompID)).safeGet(poolID);
  }

  /////////////////
  // CALCULATIONS

  /// @notice constant-product output for an exact input, after the swap fee
  function calcAmountOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut,
    uint256 feeBps
  ) internal pure returns (uint256) {
    uint256 amountInWithFee = amountIn * (BPS_DENOMINATOR - feeBps);
    return (amountInWithFee * reserveOut) / (reserveIn * BPS_DENOMINATOR + amountInWithFee);
  }

  /// @notice equivalent value of amountA in item B at the current reserve ratio
  function quote(
    uint256 amountA,
    uint256 reserveA,
    uint256 reserveB
  ) internal pure returns (uint256) {
    require(reserveA > 0, "Pool: no reserves");
    return (amountA * reserveB) / reserveA;
  }

  /// @notice shares minted for the initial (admin) seed
  function calcInitialLiquidity(uint256 amtA, uint256 amtB) internal pure returns (uint256) {
    return FixedPointMathLib.sqrt(amtA * amtB);
  }

  function min(uint256 a, uint256 b) internal pure returns (uint256) {
    return a < b ? a : b;
  }

  ///////////////////
  // LOGGING

  function logSwap(
    IWorld world,
    IUintComp comps,
    uint256 accID,
    uint256 poolID,
    uint32 indexIn,
    uint32 indexOut,
    uint256 amountIn,
    uint256 amountOut
  ) internal {
    LibData.inc(comps, accID, 0, "POOL_SWAP_TOTAL", 1);
    LibData.inc(comps, 0, indexIn, "POOL_VOLUME", amountIn);
    LibData.inc(comps, 0, indexOut, "POOL_VOLUME", amountOut);
    LibEmitter.emitEvent(
      world,
      "POOL_SWAP",
      swapEventSchema(),
      abi.encode(accID, poolID, indexIn, indexOut, amountIn, amountOut)
    );
  }

  function logLiquidity(
    IWorld world,
    IUintComp comps,
    uint256 accID,
    uint256 poolID,
    bool isAdd,
    uint256 amtA,
    uint256 amtB,
    uint256 shares
  ) internal {
    LibData.inc(comps, accID, 0, isAdd ? "POOL_LIQUIDITY_ADD" : "POOL_LIQUIDITY_REMOVE", 1);
    LibEmitter.emitEvent(
      world,
      isAdd ? "POOL_LIQUIDITY_ADD" : "POOL_LIQUIDITY_REMOVE",
      liquidityEventSchema(),
      abi.encode(accID, poolID, amtA, amtB, shares)
    );
  }

  function swapEventSchema() internal pure returns (uint8[] memory) {
    uint8[] memory _schema = new uint8[](6);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // accID
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // poolID
    _schema[2] = uint8(LibTypes.SchemaValue.UINT32); // itemIn
    _schema[3] = uint8(LibTypes.SchemaValue.UINT32); // itemOut
    _schema[4] = uint8(LibTypes.SchemaValue.UINT256); // amountIn
    _schema[5] = uint8(LibTypes.SchemaValue.UINT256); // amountOut
    return _schema;
  }

  function liquidityEventSchema() internal pure returns (uint8[] memory) {
    uint8[] memory _schema = new uint8[](5);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256); // accID
    _schema[1] = uint8(LibTypes.SchemaValue.UINT256); // poolID
    _schema[2] = uint8(LibTypes.SchemaValue.UINT256); // amtA
    _schema[3] = uint8(LibTypes.SchemaValue.UINT256); // amtB
    _schema[4] = uint8(LibTypes.SchemaValue.UINT256); // shares
    return _schema;
  }

  /////////////////
  // UTILS

  function genShareID(uint256 poolID, uint256 holderID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("amm.pool.share", poolID, holderID)));
  }
}
