// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

import { Pet721 } from "tokens/Pet721.sol";

uint256 constant ID = uint256(keccak256("system.Pet721.Transfer"));

// Unimplemented as of now. May be more useful to convert this into a working registry
contract Pet721TransferSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public pure returns (bytes memory) {
    return "";
  }

  function executeTyped(address to) public pure returns (bytes memory) {
    return execute(abi.encode(to));
  }
}
