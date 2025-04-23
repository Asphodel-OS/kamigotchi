// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.account.set.operator"));

// sets the operating address of an account. must be called by Owner EOA
contract AccountSetOperatorSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    address operator = abi.decode(arguments, (address));
    if (LibAccount.operatorInUse(components, operator)) revert("Account: Operator already in use");

    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    address prevOperator = LibAccount.getOperator(components, accID);
    LibAccount.setOperator(components, accID, operator, prevOperator);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return abi.encode(accID);
  }

  function executeTyped(address operator) public returns (bytes memory) {
    return execute(abi.encode(operator));
  }
}
