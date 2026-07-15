// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { SystemCall } from "deployment/SystemCall.s.sol";
import { console } from "forge-std/console.sol";

import { AccountRegisterSystem } from "systems/AccountRegisterSystem.sol";
import { PoolSystem } from "systems/PoolSystem.sol";
import { _DistributeItemSystem } from "systems/_DistributeItemSystem.sol";
import { _PoolRegistrySystem } from "systems/_PoolRegistrySystem.sol";

// End-to-end smoke test for the item pool AMM against a live (local) world.
// Creates a MUSU/Stone pool as the admin, registers a player account, then
// swaps and adds/removes liquidity as the player.
//
// Usage (after `pnpm start` has the local world up):
//   pnpm smoke:pool
// or directly:
//   forge script deployment/contracts/PoolSmoke.s.sol:PoolSmoke --broadcast \
//     --fork-url $RPC --priority-gas-price=0 --with-gas-price=0 \
//     --sig 'run(uint256,uint256,uint256,address)' \
//     $DEPLOYER_PRIV $PLAYER_OWNER_PRIV $PLAYER_OPERATOR_PRIV $WORLD --skip test
contract PoolSmoke is SystemCall {
  uint32 constant ITEM_A = 1; // MUSU
  uint32 constant ITEM_B = 1002; // Stone
  uint256 constant SEED = 100_000;
  uint256 constant FEE_BPS = 30;

  function run(
    uint256 deployerPriv,
    uint256 ownerPriv,
    uint256 operatorPriv,
    address worldAddr
  ) external {
    _setUp(worldAddr);

    address deployerAddr = vm.addr(deployerPriv);
    address ownerAddr = vm.addr(ownerPriv);
    address operatorAddr = vm.addr(operatorPriv);

    // 1. admin: create + seed the pool (skip if a prior run already created it)
    // seeding now comes from the admin's own inventory, so the admin must be a
    // registered account holding the seed items
    uint256 poolID = uint256(keccak256(abi.encodePacked("amm.pool", ITEM_A, ITEM_B)));
    if (getReserve(poolID, ITEM_A) == 0) {
      // ensure the admin has an account (id == uint160(deployer))
      if (!_getStringComp("component.type.entity").has(uint256(uint160(deployerAddr)))) {
        vm.startBroadcast(deployerPriv);
        AccountRegisterSystem(_getSysAddr("system.account.register")).executeTyped(
          deployerAddr,
          "pooladmin"
        );
        vm.stopBroadcast();
      }
      // distribute the seed items to the admin's own inventory
      vm.startBroadcast(deployerPriv);
      address[] memory adminAcct = new address[](1);
      adminAcct[0] = deployerAddr;
      uint256[] memory seedAmt = new uint256[](1);
      seedAmt[0] = SEED;
      _DistributeItemSystem seeder = _DistributeItemSystem(_getSysAddr("system.distribute.item"));
      seeder.executeTyped(adminAcct, ITEM_A, seedAmt);
      seeder.executeTyped(adminAcct, ITEM_B, seedAmt);
      // create + seed from the admin's inventory
      _PoolRegistrySystem(_getSysAddr("system.pool.registry")).create(
        ITEM_A,
        ITEM_B,
        SEED,
        SEED,
        FEE_BPS
      );
      vm.stopBroadcast();
    }
    console.log("pool created: reserves %d / %d", getReserve(poolID, ITEM_A), getReserve(poolID, ITEM_B));

    // 2. player: register an account (skip if already registered)
    // accounts are keyed by the owner address itself (see LibAccount.getByOwner)
    uint256 accID = uint256(uint160(ownerAddr));
    if (!_getStringComp("component.type.entity").has(accID)) {
      vm.startBroadcast(ownerPriv);
      AccountRegisterSystem(_getSysAddr("system.account.register")).executeTyped(
        operatorAddr,
        "poolsmoketester"
      );
      vm.stopBroadcast();
      console.log("account registered for %s", ownerAddr);
    }

    // 3. admin: fund the player with both items
    vm.startBroadcast(deployerPriv);
    address[] memory accounts = new address[](1);
    accounts[0] = ownerAddr;
    uint256[] memory amts = new uint256[](1);
    amts[0] = 50_000;
    _DistributeItemSystem distributor = _DistributeItemSystem(
      _getSysAddr("system.distribute.item")
    );
    distributor.executeTyped(accounts, ITEM_A, amts);
    distributor.executeTyped(accounts, ITEM_B, amts);
    vm.stopBroadcast();

    // 4. player: swap A -> B with a 1% slippage bound
    PoolSystem pool = PoolSystem(_getSysAddr("system.pool"));
    uint256 amountIn = 1_000;
    uint256 expected = calcOut(amountIn, getReserve(poolID, ITEM_A), getReserve(poolID, ITEM_B));
    uint256 kBefore = getReserve(poolID, ITEM_A) * getReserve(poolID, ITEM_B);

    vm.startBroadcast(operatorPriv);
    pool.swap(ITEM_A, ITEM_B, amountIn, (expected * 99) / 100);

    // 5. player: add then remove liquidity (mins 0 — the pool ratio drifts
    // across smoke runs; slippage bounds are already exercised by the swap)
    pool.addLiquidity(ITEM_A, ITEM_B, 10_000, 10_000, 0, 0);
    vm.stopBroadcast();

    uint256 shares = getShares(poolID, accID);
    console.log("swap out (expected %d), shares minted: %d", expected, shares);

    vm.startBroadcast(operatorPriv);
    pool.removeLiquidity(ITEM_A, ITEM_B, shares, 0, 0);
    vm.stopBroadcast();

    // 6. report
    uint256 kAfter = getReserve(poolID, ITEM_A) * getReserve(poolID, ITEM_B);
    console.log("final reserves: %d / %d", getReserve(poolID, ITEM_A), getReserve(poolID, ITEM_B));
    console.log("player shares after exit: %d", getShares(poolID, accID));
    require(kAfter >= kBefore, "SMOKE FAIL: k decreased");
    require(getShares(poolID, accID) == 0, "SMOKE FAIL: shares not burned");
    console.log("POOL SMOKE PASSED");
  }

  //////////////
  // READS

  function getReserve(uint256 poolID, uint32 itemIndex) internal returns (uint256) {
    uint256 id = uint256(keccak256(abi.encodePacked("inventory.instance", poolID, itemIndex)));
    return safeGetValue(id);
  }

  function getShares(uint256 poolID, uint256 holderID) internal returns (uint256) {
    uint256 id = uint256(keccak256(abi.encodePacked("amm.pool.share", poolID, holderID)));
    return safeGetValue(id);
  }

  function safeGetValue(uint256 id) internal returns (uint256) {
    return _getUintComp("component.value").safeGet(id);
  }

  function calcOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
  ) internal pure returns (uint256) {
    uint256 inWithFee = amountIn * (10000 - FEE_BPS);
    return (inWithFee * reserveOut) / (reserveIn * 10000 + inWithFee);
  }
}
