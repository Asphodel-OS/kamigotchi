// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.account.set.name"));

// names an existing account. must be called by Owner EOA
contract AccountSetNameSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    string memory name = abi.decode(arguments, (string));
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    require(accID != 0, "Account: does not exist");
    require(bytes(name).length > 0, "Account: name cannot be empty");
    require(bytes(name).length <= 16, "Account: name must be < 16chars");
    require(LibAccount.getByName(components, name) == 0, "Account: name taken");

    LibAccount.setName(components, accID, name);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(string memory name) public returns (bytes memory) {
    return execute(abi.encode(name));
  }
}
