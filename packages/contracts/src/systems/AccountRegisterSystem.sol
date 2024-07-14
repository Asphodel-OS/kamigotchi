// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.Account.Register"));

// registers an account for the calling Owner EOA
contract AccountRegisterSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    (address operator, string memory name) = abi.decode(arguments, (address, string));
    // address unqiueness  constraints
    require(!LibAccount.ownerInUse(components, msg.sender), "Account: exists for Owner");
    require(!LibAccount.operatorInUse(components, operator), "Account: exists for Operator");

    // check for naming constraints
    require(bytes(name).length > 0, "Account: name cannot be empty");
    require(bytes(name).length <= 16, "Account: name must be < 16chars");
    require(LibAccount.getByName(components, name) == 0, "Account: name taken");

    uint256 accountID = LibAccount.create(world, components, msg.sender, operator);
    LibAccount.setName(components, accountID, name);

    LibAccount.updateLastTs(components, accountID);
    return abi.encode(accountID);
  }

  function executeTyped(
    address operator,
    string memory name
  ) public notPaused returns (bytes memory) {
    return execute(abi.encode(operator, name));
  }
}
