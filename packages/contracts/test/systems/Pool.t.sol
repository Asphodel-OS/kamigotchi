// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { FixedPointMathLib } from "utils/FixedPointMathLib.sol";
import { LibPool } from "libraries/LibPool.sol";
import { LibPoolRegistry } from "libraries/LibPoolRegistry.sol";

contract PoolTest is SetupTemplate {
  uint32 constant ITEM_A = 200;
  uint32 constant ITEM_B = 201;
  uint256 constant SEED_A = 100_000;
  uint256 constant SEED_B = 100_000;
  uint256 constant FEE_BPS = 30;

  function setUp() public override {
    super.setUp();
    _createGenericItem(ITEM_A);
    _createGenericItem(ITEM_B);
  }

  /////////////////
  // HELPERS

  function _createPool() internal returns (uint256) {
    vm.prank(deployer);
    return __PoolRegistrySystem.create(ITEM_A, ITEM_B, SEED_A, SEED_B, FEE_BPS);
  }

  function _swap(
    PlayerAccount memory acc,
    uint32 indexIn,
    uint32 indexOut,
    uint256 amountIn,
    uint256 minAmountOut
  ) internal returns (uint256) {
    vm.prank(acc.operator);
    return _PoolSystem.swap(indexIn, indexOut, amountIn, minAmountOut);
  }

  function _addLiquidity(
    PlayerAccount memory acc,
    uint256 amountADesired,
    uint256 amountBDesired
  ) internal returns (uint256, uint256, uint256) {
    vm.prank(acc.operator);
    return _PoolSystem.addLiquidity(ITEM_A, ITEM_B, amountADesired, amountBDesired, 0, 0);
  }

  function _removeLiquidity(
    PlayerAccount memory acc,
    uint256 shares
  ) internal returns (uint256, uint256) {
    vm.prank(acc.operator);
    return _PoolSystem.removeLiquidity(ITEM_A, ITEM_B, shares, 0, 0);
  }

  function _calcOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
  ) internal pure returns (uint256) {
    uint256 amountInWithFee = amountIn * (10000 - FEE_BPS);
    return (amountInWithFee * reserveOut) / (reserveIn * 10000 + amountInWithFee);
  }

  function _k(uint256 poolID) internal view returns (uint256) {
    return
      LibInventory.getBalanceOf(components, poolID, ITEM_A) *
      LibInventory.getBalanceOf(components, poolID, ITEM_B);
  }

  /////////////////
  // CREATION

  function testPoolCreate() public {
    uint256 poolID = _createPool();

    // shape
    assertEq(LibEntityType.get(components, poolID), "POOL");
    (uint32 lo, uint32 hi) = LibPoolRegistry.getItemIndices(components, poolID);
    assertEq(lo, ITEM_A);
    assertEq(hi, ITEM_B);
    assertEq(LibPoolRegistry.getFeeBps(components, poolID), FEE_BPS);

    // reserves + locked shares
    assertEq(_getItemBal(poolID, ITEM_A), SEED_A);
    assertEq(_getItemBal(poolID, ITEM_B), SEED_B);
    uint256 locked = FixedPointMathLib.sqrt(SEED_A * SEED_B);
    assertEq(LibPool.getShares(components, poolID, poolID), locked);
    assertEq(LibPool.getTotalSupply(components, poolID), locked);

    // order-insensitive lookup
    assertEq(LibPoolRegistry.get(components, ITEM_B, ITEM_A), poolID);
  }

  function testPoolCreatePermissions() public {
    vm.prank(alice.owner);
    vm.expectRevert("Auth: not an admin");
    __PoolRegistrySystem.create(ITEM_A, ITEM_B, SEED_A, SEED_B, FEE_BPS);

    vm.prank(alice.operator);
    vm.expectRevert("Auth: not an admin");
    __PoolRegistrySystem.create(ITEM_A, ITEM_B, SEED_A, SEED_B, FEE_BPS);
  }

  function testPoolCreateValidation() public {
    vm.startPrank(deployer);

    vm.expectRevert("Pool: identical items");
    __PoolRegistrySystem.create(ITEM_A, ITEM_A, SEED_A, SEED_B, FEE_BPS);

    vm.expectRevert("Item: does not exist");
    __PoolRegistrySystem.create(ITEM_A, 999, SEED_A, SEED_B, FEE_BPS);

    vm.expectRevert("Pool: seed too small");
    __PoolRegistrySystem.create(ITEM_A, ITEM_B, 999, SEED_B, FEE_BPS);

    vm.expectRevert("Pool: fee too high");
    __PoolRegistrySystem.create(ITEM_A, ITEM_B, SEED_A, SEED_B, 1001);

    __PoolRegistrySystem.create(ITEM_A, ITEM_B, SEED_A, SEED_B, FEE_BPS);

    // duplicate, in both orders
    vm.expectRevert("Pool already exists");
    __PoolRegistrySystem.create(ITEM_A, ITEM_B, SEED_A, SEED_B, FEE_BPS);
    vm.expectRevert("Pool already exists");
    __PoolRegistrySystem.create(ITEM_B, ITEM_A, SEED_A, SEED_B, FEE_BPS);

    vm.stopPrank();
  }

  function testPoolCreateNotTradable() public {
    _setFlag(LibItem.genID(ITEM_A), "NOT_TRADABLE", true);

    vm.prank(deployer);
    vm.expectRevert("Transfer includes untradeable item");
    __PoolRegistrySystem.create(ITEM_A, ITEM_B, SEED_A, SEED_B, FEE_BPS);
  }

  /////////////////
  // SWAPS

  function testSwap() public {
    uint256 poolID = _createPool();
    _giveItem(alice, ITEM_A, 10_000);

    uint256 kBefore = _k(poolID);
    uint256 expected = _calcOut(1_000, SEED_A, SEED_B);
    uint256 out = _swap(alice, ITEM_A, ITEM_B, 1_000, 0);

    assertEq(out, expected);
    assertEq(_getItemBal(alice.id, ITEM_A), 9_000);
    assertEq(_getItemBal(alice.id, ITEM_B), expected);
    assertEq(_getItemBal(poolID, ITEM_A), SEED_A + 1_000);
    assertEq(_getItemBal(poolID, ITEM_B), SEED_B - expected);
    assertGe(_k(poolID), kBefore); // k never decreases
  }

  function testSwapSlippage() public {
    _createPool();
    _giveItem(alice, ITEM_A, 10_000);

    uint256 expected = _calcOut(1_000, SEED_A, SEED_B);

    vm.prank(alice.operator);
    vm.expectRevert("Pool: slippage exceeded");
    _PoolSystem.swap(ITEM_A, ITEM_B, 1_000, expected + 1);

    // exactly at quote succeeds
    uint256 out = _swap(alice, ITEM_A, ITEM_B, 1_000, expected);
    assertEq(out, expected);
  }

  function testSwapReverts() public {
    _createPool();

    // no balance (arithmetic underflow in inventory dec)
    vm.prank(alice.operator);
    vm.expectRevert();
    _PoolSystem.swap(ITEM_A, ITEM_B, 1_000, 0);

    // zero input
    vm.prank(alice.operator);
    vm.expectRevert("Pool: zero input");
    _PoolSystem.swap(ITEM_A, ITEM_B, 0, 0);

    // unknown pair
    vm.prank(alice.operator);
    vm.expectRevert("Pool does not exist");
    _PoolSystem.swap(ITEM_A, 999, 1_000, 0);
  }

  function testSwapNotTradable() public {
    _createPool();
    _giveItem(alice, ITEM_A, 10_000);

    // item flagged after pool creation
    _setFlag(LibItem.genID(ITEM_B), "NOT_TRADABLE", true);

    vm.prank(alice.operator);
    vm.expectRevert("Transfer includes untradeable item");
    _PoolSystem.swap(ITEM_A, ITEM_B, 1_000, 0);
  }

  function testSwapBothDirections() public {
    uint256 poolID = _createPool();
    _giveItem(alice, ITEM_B, 10_000);

    uint256 expected = _calcOut(1_000, SEED_B, SEED_A);
    uint256 out = _swap(alice, ITEM_B, ITEM_A, 1_000, 0);

    assertEq(out, expected);
    assertEq(_getItemBal(poolID, ITEM_B), SEED_B + 1_000);
    assertEq(_getItemBal(poolID, ITEM_A), SEED_A - expected);
  }

  /////////////////
  // LIQUIDITY

  function testAddLiquidity() public {
    uint256 poolID = _createPool();
    _giveItem(alice, ITEM_A, 10_000);
    _giveItem(alice, ITEM_B, 10_000);

    uint256 supplyBefore = LibPool.getTotalSupply(components, poolID);
    (uint256 amtA, uint256 amtB, uint256 shares) = _addLiquidity(alice, 10_000, 10_000);

    // proportional deposit into a 1:1 pool
    assertEq(amtA, 10_000);
    assertEq(amtB, 10_000);
    assertEq(shares, (10_000 * supplyBefore) / SEED_A);
    assertEq(LibPool.getShares(components, poolID, alice.id), shares);
    assertEq(LibPool.getTotalSupply(components, poolID), supplyBefore + shares);
    assertEq(_getItemBal(poolID, ITEM_A), SEED_A + 10_000);
    assertEq(_getItemBal(poolID, ITEM_B), SEED_B + 10_000);
    assertEq(_getItemBal(alice.id, ITEM_A), 0);
    assertEq(_getItemBal(alice.id, ITEM_B), 0);
  }

  function testAddLiquiditySkewed() public {
    _createPool();
    _giveItem(alice, ITEM_A, 10_000);
    _giveItem(alice, ITEM_B, 10_000);

    // B desired below optimal: settles at (5_000, 5_000) in a 1:1 pool
    (uint256 amtA, uint256 amtB, ) = _addLiquidity(alice, 10_000, 5_000);
    assertEq(amtA, 5_000);
    assertEq(amtB, 5_000);
    assertEq(_getItemBal(alice.id, ITEM_A), 5_000);
    assertEq(_getItemBal(alice.id, ITEM_B), 5_000);
  }

  function testAddLiquidityMins() public {
    _createPool();
    _giveItem(alice, ITEM_A, 10_000);
    _giveItem(alice, ITEM_B, 10_000);

    // settles at A = 5_000 but caller demands at least 6_000 A in
    vm.prank(alice.operator);
    vm.expectRevert("Pool: insufficient A amount");
    _PoolSystem.addLiquidity(ITEM_A, ITEM_B, 10_000, 5_000, 6_000, 0);

    // settles at B = 5_000 but caller demands at least 6_000 B in
    vm.prank(alice.operator);
    vm.expectRevert("Pool: insufficient B amount");
    _PoolSystem.addLiquidity(ITEM_A, ITEM_B, 5_000, 10_000, 0, 6_000);
  }

  function testRemoveLiquidity() public {
    uint256 poolID = _createPool();
    _giveItem(alice, ITEM_A, 10_000);
    _giveItem(alice, ITEM_B, 10_000);
    (, , uint256 shares) = _addLiquidity(alice, 10_000, 10_000);

    // partial
    (uint256 amtA, uint256 amtB) = _removeLiquidity(alice, shares / 2);
    assertEq(amtA, 5_000);
    assertEq(amtB, 5_000);
    assertEq(LibPool.getShares(components, poolID, alice.id), shares - shares / 2);

    // full: share entity is deleted
    _removeLiquidity(alice, shares - shares / 2);
    assertEq(LibPool.getShares(components, poolID, alice.id), 0);
    assertTrue(!LibEntityType.has(components, LibPool.genShareID(poolID, alice.id)));
    assertEq(_getItemBal(alice.id, ITEM_A), 10_000);
    assertEq(_getItemBal(alice.id, ITEM_B), 10_000);
  }

  function testRemoveLiquidityReverts() public {
    _createPool();
    _giveItem(alice, ITEM_A, 10_000);
    _giveItem(alice, ITEM_B, 10_000);
    (, , uint256 shares) = _addLiquidity(alice, 10_000, 10_000);

    // more shares than owned (arithmetic underflow)
    vm.prank(alice.operator);
    vm.expectRevert();
    _PoolSystem.removeLiquidity(ITEM_A, ITEM_B, shares + 1, 0, 0);

    // min not met
    vm.prank(alice.operator);
    vm.expectRevert("Pool: slippage exceeded");
    _PoolSystem.removeLiquidity(ITEM_A, ITEM_B, shares, 10_001, 0);

    // zero shares
    vm.prank(alice.operator);
    vm.expectRevert("Pool: zero shares");
    _PoolSystem.removeLiquidity(ITEM_A, ITEM_B, 0, 0, 0);

    // no position at all
    vm.prank(bob.operator);
    vm.expectRevert();
    _PoolSystem.removeLiquidity(ITEM_A, ITEM_B, 1, 0, 0);
  }

  function testFeeAccrual() public {
    uint256 poolID = _createPool();
    _giveItem(alice, ITEM_A, 10_000);
    _giveItem(alice, ITEM_B, 10_000);
    (, , uint256 shares) = _addLiquidity(alice, 10_000, 10_000);

    // bob round-trips repeatedly; fees accrete into reserves
    _giveItem(bob, ITEM_A, 10_000);
    uint256 kBefore = _k(poolID);
    for (uint256 i; i < 10; i++) {
      uint256 out = _swap(bob, ITEM_A, ITEM_B, 1_000, 0);
      _swap(bob, ITEM_B, ITEM_A, out, 0);
    }
    assertGt(_k(poolID), kBefore);

    // alice exits with more value than she deposited
    (uint256 amtA, uint256 amtB) = _removeLiquidity(alice, shares);
    assertGt(amtA, 10_000);
    assertGe(amtB, 10_000 - 1); // B round-trips back exactly; floor may shave 1
  }

  function testLockedLiquidity() public {
    uint256 poolID = _createPool();
    _giveItem(alice, ITEM_A, 10_000);
    _giveItem(alice, ITEM_B, 10_000);
    (, , uint256 shares) = _addLiquidity(alice, 10_000, 10_000);
    _removeLiquidity(alice, shares);

    // pool retains the seed liquidity forever
    uint256 locked = FixedPointMathLib.sqrt(SEED_A * SEED_B);
    assertEq(LibPool.getTotalSupply(components, poolID), locked);
    assertGe(_getItemBal(poolID, ITEM_A), SEED_A);
    assertGe(_getItemBal(poolID, ITEM_B), SEED_B - 1);
  }

  /////////////////
  // ADMIN

  function testDisable() public {
    _createPool();
    _giveItem(alice, ITEM_A, 10_000);
    _giveItem(alice, ITEM_B, 10_000);
    (, , uint256 shares) = _addLiquidity(alice, 5_000, 5_000);

    vm.prank(deployer);
    __PoolRegistrySystem.setDisabled(ITEM_A, ITEM_B, true);

    vm.prank(alice.operator);
    vm.expectRevert("entity not enabled");
    _PoolSystem.swap(ITEM_A, ITEM_B, 1_000, 0);

    vm.prank(alice.operator);
    vm.expectRevert("entity not enabled");
    _PoolSystem.addLiquidity(ITEM_A, ITEM_B, 1_000, 1_000, 0, 0);

    // exit still allowed on a disabled pool
    (uint256 amtA, ) = _removeLiquidity(alice, shares);
    assertEq(amtA, 5_000);

    // re-enable
    vm.prank(deployer);
    __PoolRegistrySystem.setDisabled(ITEM_A, ITEM_B, false);
    _swap(alice, ITEM_A, ITEM_B, 1_000, 0);
  }

  function testSetFee() public {
    uint256 poolID = _createPool();

    vm.prank(deployer);
    __PoolRegistrySystem.setFee(ITEM_A, ITEM_B, 100);
    assertEq(LibPoolRegistry.getFeeBps(components, poolID), 100);

    vm.prank(deployer);
    vm.expectRevert("Pool: fee too high");
    __PoolRegistrySystem.setFee(ITEM_A, ITEM_B, 1001);
  }

  function testDonate() public {
    uint256 poolID = _createPool();
    uint256 supplyBefore = LibPool.getTotalSupply(components, poolID);

    vm.prank(deployer);
    __PoolRegistrySystem.donate(ITEM_A, ITEM_B, 5_000, 5_000);

    assertEq(_getItemBal(poolID, ITEM_A), SEED_A + 5_000);
    assertEq(_getItemBal(poolID, ITEM_B), SEED_B + 5_000);
    assertEq(LibPool.getTotalSupply(components, poolID), supplyBefore);
  }

  function testRemovePool() public {
    uint256 poolID = _createPool();
    _giveItem(alice, ITEM_A, 10_000);
    _giveItem(alice, ITEM_B, 10_000);
    (, , uint256 shares) = _addLiquidity(alice, 10_000, 10_000);

    // blocked while player shares outstanding
    vm.prank(deployer);
    vm.expectRevert("Pool: shares outstanding");
    __PoolRegistrySystem.remove(ITEM_A, ITEM_B);

    // after exit, removal cleans everything up
    _removeLiquidity(alice, shares);
    vm.prank(deployer);
    __PoolRegistrySystem.remove(ITEM_A, ITEM_B);

    assertEq(LibPoolRegistry.get(components, ITEM_A, ITEM_B), 0);
    assertTrue(!LibEntityType.has(components, poolID));
    assertEq(_getItemBal(poolID, ITEM_A), 0);
    assertEq(_getItemBal(poolID, ITEM_B), 0);
    assertEq(LibPool.getTotalSupply(components, poolID), 0);

    // same pair can be recreated
    uint256 newID = _createPool();
    assertEq(newID, poolID);
    assertEq(_getItemBal(poolID, ITEM_A), SEED_A);
  }

  /////////////////
  // MUSU PAIR

  function testMusuPair() public {
    // MUSU is just item index 1; ensure it has a registry entry in the test world
    if (LibItem.getByIndex(components, MUSU_INDEX) == 0) _createGenericItem(MUSU_INDEX);

    vm.prank(deployer);
    uint256 poolID = __PoolRegistrySystem.create(MUSU_INDEX, ITEM_A, SEED_A, SEED_B, FEE_BPS);

    _fundAccount(alice.index, 10_000); // MUSU
    uint256 expected = _calcOut(1_000, SEED_A, SEED_B);
    uint256 out = _swap(alice, MUSU_INDEX, ITEM_A, 1_000, 0);

    assertEq(out, expected);
    assertEq(_getItemBal(alice.id, ITEM_A), expected);
    assertEq(_getItemBal(poolID, MUSU_INDEX), SEED_A + 1_000);
  }

  /////////////////
  // ORACLE

  function testOracle() public {
    uint256 poolID = _createPool();
    uint256 oracleID = LibPoolRegistry.genOracleID(poolID);
    _giveItem(alice, ITEM_A, 10_000);

    // 100s at 1:1 spot price accumulates 100 * 1e18 on both sides
    _fastForward(100);
    _swap(alice, ITEM_A, ITEM_B, 1_000, 0);

    uint256[] memory vals = _ValuesComponent.get(oracleID);
    assertEq(vals[0], 100 * 1e18);
    assertEq(vals[1], 100 * 1e18);
    assertEq(vals[2], block.timestamp);

    // second period accumulates at the new (post-swap) spot price
    uint256 reserveA = _getItemBal(poolID, ITEM_A);
    uint256 reserveB = _getItemBal(poolID, ITEM_B);
    _fastForward(50);
    _swap(alice, ITEM_A, ITEM_B, 1_000, 0);

    vals = _ValuesComponent.get(oracleID);
    assertEq(vals[0], 100 * 1e18 + ((reserveB * 1e18) / reserveA) * 50);
    assertEq(vals[1], 100 * 1e18 + ((reserveA * 1e18) / reserveB) * 50);
  }
}
