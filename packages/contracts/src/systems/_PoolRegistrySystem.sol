// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibPool } from "libraries/LibPool.sol";
import { LibPoolRegistry } from "libraries/LibPoolRegistry.sol";

uint256 constant ID = uint256(keccak256("system.pool.registry"));

uint256 constant MAX_FEE_BPS = 1000; // 10%
uint256 constant MINIMUM_SEED = 1000; // per side, keeps integer rounding tolerable

// create or manage a constant-product Pool between two fungible items
// NOTE: seeding mints reserves out of thin air (admin faucet); the initial
// shares are locked to the pool itself so supply/reserves can never fully drain
contract _PoolRegistrySystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  /// @notice create a pool and atomically seed its initial reserves
  function create(
    uint32 indexA,
    uint32 indexB,
    uint256 amtA,
    uint256 amtB,
    uint256 feeBps
  ) public onlyAdmin(components) returns (uint256 id) {
    require(indexA != indexB, "Pool: identical items");
    require(LibItem.getByIndex(components, indexA) != 0, "Item: does not exist");
    require(LibItem.getByIndex(components, indexB) != 0, "Item: does not exist");
    verifyTradable(indexA, indexB);
    // token-backed items (ERC20-mirrored, e.g. ONYX) are unsupported: seeding
    // mints reserves from thin air, which would create shards with no portal
    // backing. explicit guard so a future transfer-based seeding refactor can't
    // silently make unbacked token pools (incFor already reverts, but only
    // incidentally). ONYX pools need a treasury seed/return model — see PR notes.
    verifyNoToken(indexA, indexB);
    require(feeBps <= MAX_FEE_BPS, "Pool: fee too high");
    require(amtA >= MINIMUM_SEED && amtB >= MINIMUM_SEED, "Pool: seed too small");
    require(LibPoolRegistry.get(components, indexA, indexB) == 0, "Pool already exists");

    // the pool id is a pure hash of the item pair, so anyone can precompute it
    // and pre-fund the entity before creation (ItemTransferSystem does not
    // require an account target). refuse to seed onto non-empty reserves — the
    // locked shares are sqrt(amt*amt) of the ARGS, so a pre-funded reserve would
    // launch the pool at a skewed price and hand free arbitrage to the griefer.
    id = LibPoolRegistry.genID(indexA, indexB);
    require(
      LibInventory.getBalanceOf(components, id, indexA) == 0 &&
        LibInventory.getBalanceOf(components, id, indexB) == 0,
      "Pool: reserves not empty"
    );

    id = LibPoolRegistry.create(components, indexA, indexB, feeBps);
    LibInventory.incFor(components, id, indexA, amtA);
    LibInventory.incFor(components, id, indexB, amtB);
    LibPool.mintShares(components, id, id, LibPool.calcInitialLiquidity(amtA, amtB));
  }

  /// @notice deepen reserves without minting shares (boosts LP value)
  function donate(
    uint32 indexA,
    uint32 indexB,
    uint256 amtA,
    uint256 amtB
  ) public onlyAdmin(components) {
    uint256 id = LibPoolRegistry.get(components, indexA, indexB);
    require(id != 0, "Pool does not exist");
    verifyNoToken(indexA, indexB); // same token-backed exclusion as create
    if (amtA > 0) LibInventory.incFor(components, id, indexA, amtA);
    if (amtB > 0) LibInventory.incFor(components, id, indexB, amtB);
  }

  function setFee(uint32 indexA, uint32 indexB, uint256 feeBps) public onlyAdmin(components) {
    uint256 id = LibPoolRegistry.get(components, indexA, indexB);
    require(id != 0, "Pool does not exist");
    require(feeBps <= MAX_FEE_BPS, "Pool: fee too high");
    LibPoolRegistry.setFee(components, id, feeBps);
  }

  /// @notice pause a pool; swaps and adds are blocked but LPs can still exit
  function setDisabled(uint32 indexA, uint32 indexB, bool disabled) public onlyAdmin(components) {
    uint256 id = LibPoolRegistry.get(components, indexA, indexB);
    require(id != 0, "Pool does not exist");
    LibPoolRegistry.setDisabled(components, id, disabled);
  }

  /// @notice delete a pool once all players have exited, burning remaining reserves
  function remove(uint32 indexA, uint32 indexB) public onlyAdmin(components) {
    uint256 id = LibPoolRegistry.get(components, indexA, indexB);
    require(id != 0, "Pool does not exist");

    uint256 locked = LibPool.getShares(components, id, id);
    require(LibPool.getTotalSupply(components, id) == locked, "Pool: shares outstanding");

    // clear locked shares directly (burnShares forbids the pool as holder)
    if (locked > 0) {
      LibPool.burnLockedShares(components, id);
    }

    // burn remaining reserves
    (uint32 lo, uint32 hi) = LibPoolRegistry.getItemIndices(components, id);
    uint256 reserveLo = LibInventory.getBalanceOf(components, id, lo);
    uint256 reserveHi = LibInventory.getBalanceOf(components, id, hi);
    if (reserveLo > 0) LibInventory.decFor(components, id, lo, reserveLo);
    if (reserveHi > 0) LibInventory.decFor(components, id, hi, reserveHi);

    LibPoolRegistry.remove(components, id);
  }

  /// @dev pools of untradable items would strand LPs; mirror trade/transfer rules
  function verifyTradable(uint32 indexA, uint32 indexB) internal view {
    uint32[] memory indices = new uint32[](2);
    indices[0] = indexA;
    indices[1] = indexB;
    LibInventory.verifyTransferable(components, indices);
  }

  /// @dev reverts if either item is ERC20-backed (has a TokenAddress). pools
  ///      hold reserves as plain inventory; token-backed reserves would be
  ///      unbacked in the portal.
  function verifyNoToken(uint32 indexA, uint32 indexB) internal view {
    LibItem.verifyToken(components, indexA, false);
    LibItem.verifyToken(components, indexB, false);
  }

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    require(false, "not implemented");
  }
}
