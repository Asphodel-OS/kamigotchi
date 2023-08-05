// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibRegistryQuests } from "libraries/LibRegistryQuests.sol";

uint256 constant ID = uint256(keccak256("system._Registry.Condition.Create"));

// real important to remove this for deployment! would allow for free minting
// gives coins to the calling account
contract _RegistryCreateConditionSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (
      uint256 index,
      uint256 balance, // can be empty
      uint256 itemIndex, // can be empty
      string memory name,
      string memory logicType,
      string memory _type
    ) = abi.decode(arguments, (uint256, uint256, uint256, string, string, string));

    uint256 id = LibRegistryQuests.createEmptyCondition(world, components, index, name, logicType);

    LibRegistryQuests.addBalance(world, components, id, balance, itemIndex, _type);

    return "";
  }

  function executeTyped(
    uint256 index,
    uint256 balance, // can be empty
    uint256 itemIndex, // can be empty
    string memory name,
    string memory logicType,
    string memory _type
  ) public onlyOwner returns (bytes memory) {
    return
      execute(
        abi.encode(
          index,
          balance, // can be empty
          itemIndex, // can be empty
          name,
          logicType,
          _type
        )
      );
  }
}
