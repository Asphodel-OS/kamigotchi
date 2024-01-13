// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibNode } from "libraries/LibNode.sol";

uint256 constant ID = uint256(keccak256("system._Node.Delete"));

// Delete a Node as specified
contract _NodeDeleteSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    uint256 index = abi.decode(arguments, (uint256));
    uint256 id = LibNode.getByIndex(components, index);

    require(id != 0, "Node: does not exist");

    LibNode.remove(components, id);

    return "";
  }

  function executeTyped(uint256 index) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(index));
  }
}
