// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import {
  LibSacrifice,
  SACRIFICE_DT_NORMAL,
  SACRIFICE_DT_UNCOMMON_PITY,
  SACRIFICE_DT_RARE_PITY
} from "libraries/LibSacrifice.sol";

uint256 constant ID = uint256(keccak256("system.sacrifice.registry"));

/// @notice Registry system for configuring sacrifice droptables
/// @dev Admin-only system for setting up reward tables for kami sacrifices
contract _SacrificeRegistrySystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  /// @notice Set the normal sacrifice droptable (used for most sacrifices)
  /// @param keys Array of item indices that can be rewarded
  /// @param weights Array of weights for random selection (higher = more likely)
  function setNormalDroptable(
    uint32[] memory keys,
    uint256[] memory weights
  ) public onlyAdmin(components) {
    require(keys.length == weights.length, "SacrificeReg: length mismatch");
    require(keys.length > 0, "SacrificeReg: empty droptable");
    LibSacrifice.setDroptable(components, SACRIFICE_DT_NORMAL, keys, weights);
  }

  /// @notice Set the uncommon pity droptable (used every 20th sacrifice)
  /// @param keys Array of item indices that can be rewarded
  /// @param weights Array of weights for random selection (higher = more likely)
  function setUncommonPityDroptable(
    uint32[] memory keys,
    uint256[] memory weights
  ) public onlyAdmin(components) {
    require(keys.length == weights.length, "SacrificeReg: length mismatch");
    require(keys.length > 0, "SacrificeReg: empty droptable");
    LibSacrifice.setDroptable(components, SACRIFICE_DT_UNCOMMON_PITY, keys, weights);
  }

  /// @notice Set the rare pity droptable (used every 100th sacrifice)
  /// @param keys Array of item indices that can be rewarded
  /// @param weights Array of weights for random selection (higher = more likely)
  function setRarePityDroptable(
    uint32[] memory keys,
    uint256[] memory weights
  ) public onlyAdmin(components) {
    require(keys.length == weights.length, "SacrificeReg: length mismatch");
    require(keys.length > 0, "SacrificeReg: empty droptable");
    LibSacrifice.setDroptable(components, SACRIFICE_DT_RARE_PITY, keys, weights);
  }

  /// @notice Convenience function to set all droptables at once
  /// @param normalKeys Item indices for normal droptable
  /// @param normalWeights Weights for normal droptable
  /// @param uncommonKeys Item indices for uncommon pity droptable
  /// @param uncommonWeights Weights for uncommon pity droptable
  /// @param rareKeys Item indices for rare pity droptable
  /// @param rareWeights Weights for rare pity droptable
  function setAllDroptables(
    uint32[] memory normalKeys,
    uint256[] memory normalWeights,
    uint32[] memory uncommonKeys,
    uint256[] memory uncommonWeights,
    uint32[] memory rareKeys,
    uint256[] memory rareWeights
  ) public onlyAdmin(components) {
    setNormalDroptable(normalKeys, normalWeights);
    setUncommonPityDroptable(uncommonKeys, uncommonWeights);
    setRarePityDroptable(rareKeys, rareWeights);
  }

  /// @notice Required by ISystem interface - not used for registry systems
  function execute(bytes memory) public pure returns (bytes memory) {
    revert("SacrificeReg: use typed functions");
  }
}
