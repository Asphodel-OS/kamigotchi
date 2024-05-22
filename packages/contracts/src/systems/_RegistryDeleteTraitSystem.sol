// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibTraitRegistry } from "libraries/LibTraitRegistry.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Trait.Delete"));

contract _RegistryDeleteTraitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint32 index, string memory traitType) = abi.decode(arguments, (uint32, string));

    uint256 traitID;
    if (LibString.eq(traitType, "BODY"))
      traitID = LibTraitRegistry.getByBodyIndex(components, index);
    else if (LibString.eq(traitType, "BACKGROUND"))
      traitID = LibTraitRegistry.getByBackgroundIndex(components, index);
    else if (LibString.eq(traitType, "COLOR"))
      traitID = LibTraitRegistry.getByColorIndex(components, index);
    else if (LibString.eq(traitType, "FACE"))
      traitID = LibTraitRegistry.getByFaceIndex(components, index);
    else if (LibString.eq(traitType, "HAND"))
      traitID = LibTraitRegistry.getByHandIndex(components, index);
    else revert("invalid traitType");

    require(traitID != 0, "Trait: does not exist");

    LibTraitRegistry.remove(components, traitID);

    return "";
  }

  function executeTyped(
    uint256 index,
    string memory traitType
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, traitType));
  }
}
