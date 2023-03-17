// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibModifier } from "libraries/LibModifier.sol";

uint256 constant ID = uint256(keccak256("system._Modifier.Add"));

contract _AddModifierSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      string memory genus,
      uint256 index,
      uint256 modValue,
      string memory modType,
      string memory petType,
      string memory name
    ) = abi.decode(arguments, (string, uint256, uint256, string, string, string));

    LibModifier.createIndex(components, world, genus, index, modValue, modType, petType, name);

    return "";
  }

  function executeTyped(
    string memory genus,
    uint256 index,
    uint256 modValue,
    string memory modType,
    string memory petType,
    string memory name
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(genus, index, modValue, modType, petType, name));
  }
}
