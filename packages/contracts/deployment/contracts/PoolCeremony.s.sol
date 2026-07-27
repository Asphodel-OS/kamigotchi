// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "deployment/Imports.sol";

import { SystemCall } from "deployment/SystemCall.s.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibPoolRegistry } from "libraries/LibPoolRegistry.sol";
import { console } from "forge-std/console.sol";

/** @notice
 * PoolCeremony seeds an item pool the production way: a treasury account that
 * already holds the seed items creates the pool itself, with ROLE_ADMIN
 * granted only for the ceremony and revoked at the end. Nothing is minted and
 * no account is registered here — the treasury must exist and be funded
 * beforehand (ONYX only via portal deposit; test worlds can faucet via
 * _DistributeItemSystem or a god script).
 *
 * Run via `pnpm world:pool:create:<env>` with per-run env params (pass them
 * inline on the command; deployer key / RPC / WORLD come from .env.<env>):
 *   TREASURY_PRIV_KEY  treasury account owner key (signs create)
 *   POOL_ITEM_A/B      item indices
 *   POOL_SEED_A/B      seed amounts (>= 1000 each)
 *   POOL_FEE_BPS       swap fee, basis points (<= 1000)
 *
 *   TREASURY_PRIV_KEY=0x... \
 *   POOL_ITEM_A=1 POOL_ITEM_B=100 \
 *   POOL_SEED_A=100000 POOL_SEED_B=50000 \
 *   POOL_FEE_BPS=30 \
 *   pnpm world:pool:create:prod
 *
 * Any invalid input aborts during forge's simulation with a named error,
 * before any tx is broadcast: missing vars (runner + vm.envUint), unregistered
 * items / missing account / short inventory (preflight below), and everything
 * else (fee cap, minimum seed, tradability, duplicate pool) via create()'s own
 * on-chain checks, which also execute in the simulation.
 *
 * The treasury pays real gas: it must hold the chain's fee token, and the
 * runner sends legacy txs at the chain's min gas price (the deployer alone is
 * fee-exempt at the sequencer, so the god runner's zero-price flags would fail
 * here).
 *
 * Reruns self-heal a partial failure: if the pool exists and the treasury
 * still carries the ceremony role (create landed, revoke didn't), only the
 * revoke is performed. A role the treasury held BEFORE the ceremony is never
 * granted or revoked by this script.
 *
 * Works while the deployer owns _AuthManageRoleSystem (true while MULTISIG is
 * unset). After an ownership handoff, grant/revoke become multisig txs and
 * this script only performs the treasury's create step.
 */
contract PoolCeremony is SystemCall {
  function run(uint256 deployerPriv, address worldAddr) external {
    _setUp(worldAddr);

    uint256 treasuryPriv = vm.envUint("TREASURY_PRIV_KEY");
    uint32 itemA = uint32(vm.envUint("POOL_ITEM_A"));
    uint32 itemB = uint32(vm.envUint("POOL_ITEM_B"));
    uint256 seedA = vm.envUint("POOL_SEED_A");
    uint256 seedB = vm.envUint("POOL_SEED_B");
    uint256 feeBps = vm.envUint("POOL_FEE_BPS");

    address treasury = vm.addr(treasuryPriv);
    uint256 treasuryID = uint256(uint160(treasury));
    console.log("treasury:", treasury);

    // preflight: fail the simulation with a clear message before any tx
    require(
      LibEntityType.isShape(components, treasuryID, "ACCOUNT"),
      "PoolCeremony: treasury has no game account"
    );
    require(LibItem.getByIndex(components, itemA) != 0, "PoolCeremony: item A not registered");
    require(LibItem.getByIndex(components, itemB) != 0, "PoolCeremony: item B not registered");

    bool hadRole = LibFlag.has(components, treasuryID, "ROLE_ADMIN");
    _AuthManageRoleSystem auth = _AuthManageRoleSystem(_getSysAddr("system.auth.registry"));

    // rerun after partial failure (create landed, revoke didn't): a role
    // alongside an existing pool is treated as dangling and cleaned up —
    // ceremony grants are ephemeral by doctrine, so no standing role should
    // ever coexist with a completed pool
    if (LibPoolRegistry.get(components, itemA, itemB) != 0) {
      require(hadRole, "PoolCeremony: pool already exists");
      console.log("pool exists; revoking dangling ceremony role");
      vm.startBroadcast(deployerPriv);
      auth.removeRole(treasury, "ROLE_ADMIN");
      vm.stopBroadcast();
      console.log("ROLE_ADMIN revoked");
      return;
    }

    require(
      LibInventory.getBalanceOf(components, treasuryID, itemA) >= seedA,
      "PoolCeremony: treasury short on item A"
    );
    require(
      LibInventory.getBalanceOf(components, treasuryID, itemB) >= seedB,
      "PoolCeremony: treasury short on item B"
    );

    if (!hadRole) {
      vm.startBroadcast(deployerPriv);
      auth.addRole(treasury, "ROLE_ADMIN");
      vm.stopBroadcast();
      console.log("ROLE_ADMIN granted (ephemeral)");
    } else console.log("treasury already holds ROLE_ADMIN; leaving it standing");

    vm.startBroadcast(treasuryPriv);
    uint256 poolID = _PoolRegistrySystem(_getSysAddr("system.pool.registry")).create(
      itemA,
      itemB,
      seedA,
      seedB,
      feeBps
    );
    vm.stopBroadcast();
    console.log("pool created, id:", poolID);
    console.log("  reserve A:", LibInventory.getBalanceOf(components, poolID, itemA));
    console.log("  reserve B:", LibInventory.getBalanceOf(components, poolID, itemB));
    console.log("  shares   :", LibPool.getTotalSupply(components, poolID));

    if (!hadRole) {
      vm.startBroadcast(deployerPriv);
      auth.removeRole(treasury, "ROLE_ADMIN");
      vm.stopBroadcast();
      console.log("ROLE_ADMIN revoked");
    }
  }
}
