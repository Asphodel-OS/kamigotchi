// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { TraitValues, LibTraitRegistry } from "libraries/LibTraitRegistry.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system.trait.registry"));

// Adds a trait to the registry.
// Traits are condensed here with a string identifier to reduce number of systems
contract _TraitRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyOwner returns (uint256) {
    (
      uint32 index,
      int32 health,
      int32 power,
      int32 violence,
      int32 harmony,
      int32 slots,
      uint256 rarity,
      string memory affinity,
      string memory name,
      string memory traitType
    ) = abi.decode(
        arguments,
        (uint32, int32, int32, int32, int32, int32, uint256, string, string, string)
      );

    TraitValues memory values = TraitValues(
      name,
      health,
      power,
      violence,
      harmony,
      slots,
      rarity,
      affinity
    );

    return LibTraitRegistry.create(components, index, traitType, values);
  }

  function remove(uint32 index, string memory traitType) public onlyOwner {
    uint256 traitID = LibTraitRegistry.getByIndex(components, index, traitType);
    require(traitID != 0, "Trait: does not exist");
    LibTraitRegistry.remove(components, traitID);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
