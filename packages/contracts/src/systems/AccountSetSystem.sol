// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.Account.Set"));

// sets the operating address of an account, identified by its owner
contract AccountSetSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (address newAccount, string memory name) = abi.decode(arguments, (address, string));
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);

    if (accountID == 0) {
      accountID = LibAccount.create(world, components, newAccount, msg.sender);
    }

    LibAccount.setName(components, accountID, name);
    LibAccount.setAddress(components, accountID, msg.sender);
    return abi.encode(accountID);
  }

  function executeTyped(address account, string memory name) public returns (bytes memory) {
    return execute(abi.encode(account, name));
  }
}
