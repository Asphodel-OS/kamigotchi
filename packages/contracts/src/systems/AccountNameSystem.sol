// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.Account.Name"));

// names an existing account, identified by the calling account
contract AccountNameSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    string memory name = abi.decode(arguments, (string));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);

    require(accountID != 0, "Account: does not exist");

    LibAccount.setName(components, accountID, name);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(string memory name) public returns (bytes memory) {
    return execute(abi.encode(name));
  }
}
