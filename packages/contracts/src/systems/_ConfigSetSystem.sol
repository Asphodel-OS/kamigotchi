// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibConfig } from "libraries/LibConfig.sol";

uint256 constant ID = uint256(keccak256("system._Config.Set"));

// _ConfigSetSystem creates a global config field entity of the provided type
contract _ConfigSetSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (string memory name, uint256 value) = abi.decode(arguments, (string, uint256));
    uint256 configID = LibConfig.getID(name);
    LibConfig.setValue(components, configID, value);

    return "";
  }

  function executeTyped(string memory name, uint256 value) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(name, value));
  }

  function setValue(string memory name, uint256 value) public onlyOwner {
    uint256 configID = LibConfig.getID(name);
    LibConfig.setValue(components, configID, value);
  }

  function setValueArray(string memory name, uint32[8] memory values) public onlyOwner {
    uint256 configID = LibConfig.getID(name);
    LibConfig.setValueArray(components, configID, values);
  }

  function setValueString(string memory name, string memory value) public onlyOwner {
    uint256 configID = LibConfig.getID(name);
    LibConfig.setValueString(components, configID, value);
  }
}
