// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";
import { LibString } from "solady/utils/LibString.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Trait.Delete"));

contract _RegistryDeleteTraitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 index, string memory traitType) = abi.decode(arguments, (uint256, string));

    uint256 traitID;
    if (LibString.eq(traitType, "BODY"))
      traitID = LibRegistryTrait.getByBodyIndex(components, index);
    else if (LibString.eq(traitType, "BACKGROUND"))
      traitID = LibRegistryTrait.getByBackgroundIndex(components, index);
    else if (LibString.eq(traitType, "COLOR"))
      traitID = LibRegistryTrait.getByColorIndex(components, index);
    else if (LibString.eq(traitType, "FACE"))
      traitID = LibRegistryTrait.getByFaceIndex(components, index);
    else if (LibString.eq(traitType, "HAND"))
      traitID = LibRegistryTrait.getByHandIndex(components, index);
    else revert("invalid traitType");

    require(traitID != 0, "Trait: does not exist");

    LibRegistryTrait.remove(components, traitID);

    return "";
  }

  function executeTyped(
    uint256 index,
    string memory traitType
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index, traitType));
  }
}
