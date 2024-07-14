// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.Account.Set.Operator"));

// sets the operating address of an account. must be called by Owner EOA
contract AccountSetOperatorSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    address operator = abi.decode(arguments, (address));
    require(!LibAccount.operatorInUse(components, operator), "Account: Operator already in use");

    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "Account: does not exist");

    address prevOperator = LibAccount.getOperator(components, accountID);
    LibAccount.setOperator(components, accountID, operator, prevOperator);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return abi.encode(accountID);
  }

  function executeTyped(address operator) public notPaused returns (bytes memory) {
    return execute(abi.encode(operator));
  }
}
