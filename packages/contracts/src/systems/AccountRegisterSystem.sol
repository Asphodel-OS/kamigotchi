// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.Account.Register"));

// registers an account for the calling Owner EOA
contract AccountRegisterSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (address operator, string memory name, string memory food) = abi.decode(
      arguments,
      (address, string, string)
    );
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID == 0, "Account: exists for Owner");

    accountID = LibAccount.getByOperator(components, operator);
    require(accountID == 0, "Account: exists for Operator");

    // check for naming constraints
    require(bytes(name).length > 0, "Account: name cannot be empty");
    require(bytes(name).length <= 16, "Account: name must be < 16chars");
    require(LibAccount.getByName(components, name) == 0, "Account: name taken");

    accountID = LibAccount.create(world, components, msg.sender, operator);
    LibAccount.setName(components, accountID, name);
    LibAccount.setFavoriteFood(components, accountID, food);
    return abi.encode(accountID);
  }

  function executeTyped(
    address operator,
    string memory name,
    string memory food
  ) public returns (bytes memory) {
    return execute(abi.encode(operator, name, food));
  }
}
