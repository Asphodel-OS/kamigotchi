// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";

import { KeysComponent, ID as KeysCompID } from "components/KeysComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

import { LibDisabled } from "libraries/utils/LibDisabled.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

/** @notice
 * LibPoolRegistry handles the creation, removal and update of Pool entities.
 * A Pool is a constant-product (x*y=k) market between two fungible items.
 *
 * Pool entities are shaped as follows:
 *  - EntityType: POOL
 *  - Keys: [itemIndexLo, itemIndexHi] (canonically sorted, lo < hi)
 *  - Value: the swap fee, in basis points
 *  - TimeStart: the time the pool was created
 *  - IsDisabled: (optional) pauses swaps and liquidity adds
 *
 * Child entities hanging off a pool:
 *  - Supply (Value): total LP shares outstanding
 *  - Oracle (Values): [priceLoCumulative, priceHiCumulative, lastUpdateTs]
 *  - Reserves: the pool's own inventory instances (see LibInventory)
 *  - Shares: LP positions (see LibPool)
 */
library LibPoolRegistry {
  ////////////
  // SHAPES

  /// @notice create a pool between two items with the given swap fee
  /// @dev reserves are seeded and locked shares minted separately (see _PoolRegistrySystem)
  function create(
    IUintComp comps,
    uint32 indexA,
    uint32 indexB,
    uint256 feeBps
  ) internal returns (uint256 id) {
    (uint32 lo, uint32 hi) = sortIndices(indexA, indexB);
    id = genID(lo, hi);
    LibEntityType.set(comps, id, "POOL");

    uint32[] memory keys = new uint32[](2);
    keys[0] = lo;
    keys[1] = hi;
    KeysComponent(getAddrByID(comps, KeysCompID)).set(id, keys);
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, feeBps);
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).set(id, block.timestamp);

    uint256[] memory oracle = new uint256[](3);
    oracle[2] = block.timestamp;
    ValuesComponent(getAddrByID(comps, ValuesCompID)).set(genOracleID(id), oracle);
  }

  /// @notice remove all data associated with a pool
  /// @dev reserves and locked shares must be cleared beforehand (see _PoolRegistrySystem)
  function remove(IUintComp comps, uint256 id) internal {
    LibEntityType.remove(comps, id);
    KeysComponent(getAddrByID(comps, KeysCompID)).remove(id);
    ValueComponent(getAddrByID(comps, ValueCompID)).remove(id);
    TimeStartComponent(getAddrByID(comps, TimeStartCompID)).remove(id);
    LibDisabled.set(comps, id, false);

    ValueComponent(getAddrByID(comps, ValueCompID)).remove(genSupplyID(id));
    ValuesComponent(getAddrByID(comps, ValuesCompID)).remove(genOracleID(id));
  }

  /////////////////
  // SETTERS

  function setFee(IUintComp comps, uint256 id, uint256 feeBps) internal {
    ValueComponent(getAddrByID(comps, ValueCompID)).set(id, feeBps);
  }

  function setDisabled(IUintComp comps, uint256 id, bool disabled) internal {
    LibDisabled.set(comps, id, disabled);
  }

  /////////////////
  // GETTERS

  /// @notice gets a pool by its item indices (order-insensitive)
  function get(IUintComp comps, uint32 indexA, uint32 indexB) internal view returns (uint256) {
    uint256 id = genID(indexA, indexB);
    return LibEntityType.isShape(comps, id, "POOL") ? id : 0;
  }

  function getItemIndices(
    IUintComp comps,
    uint256 id
  ) internal view returns (uint32 lo, uint32 hi) {
    uint32[] memory keys = KeysComponent(getAddrByID(comps, KeysCompID)).get(id);
    return (keys[0], keys[1]);
  }

  function getFeeBps(IUintComp comps, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddrByID(comps, ValueCompID)).get(id);
  }

  /////////////////
  // UTILS

  function sortIndices(uint32 a, uint32 b) internal pure returns (uint32 lo, uint32 hi) {
    return a < b ? (a, b) : (b, a);
  }

  function genID(uint32 indexA, uint32 indexB) internal pure returns (uint256) {
    (uint32 lo, uint32 hi) = sortIndices(indexA, indexB);
    return uint256(keccak256(abi.encodePacked("amm.pool", lo, hi)));
  }

  function genSupplyID(uint256 poolID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("amm.pool.supply", poolID)));
  }

  function genOracleID(uint256 poolID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("amm.pool.oracle", poolID)));
  }
}
