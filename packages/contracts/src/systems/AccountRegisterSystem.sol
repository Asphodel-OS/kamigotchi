// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.account.register"));

// registers an account for the calling Owner EOA
contract AccountRegisterSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (address operator, string memory name) = abi.decode(arguments, (address, string));

    // check for private world
    LibAccount.verifyWorldWL(components, msg.sender);

    // address uniqueness constraints
    if (LibAccount.ownerInUse(components, msg.sender)) revert("Account: exists for Owner");
    if (LibAccount.operatorInUse(components, operator)) revert("Account: exists for Operator");

    // check for naming constraints
    if (bytes(name).length == 0) revert("Account: name cannot be empty");
    if (bytes(name).length > 16) revert("Account: name must be < 16chars");
    if (LibAccount.getByName(components, name) != 0) revert("Account: name taken");

    uint256 accID = LibAccount.create(components, msg.sender, operator);
    LibAccount.setName(components, accID, name);

    LibAccount.updateLastTs(components, accID);
    return abi.encode(accID);
  }

  function executeTyped(address operator, string memory name) public returns (bytes memory) {
    return execute(abi.encode(operator, name));
  }
}
