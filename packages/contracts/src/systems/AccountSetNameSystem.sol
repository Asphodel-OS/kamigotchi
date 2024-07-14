// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.Account.Set.Name"));

// names an existing account. must be called by Owner EOA
contract AccountSetNameSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    string memory name = abi.decode(arguments, (string));
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);

    require(accountID != 0, "Account: does not exist");
    require(bytes(name).length > 0, "Account: name cannot be empty");
    require(bytes(name).length <= 16, "Account: name must be < 16chars");
    require(LibAccount.getByName(components, name) == 0, "Account: name taken");

    LibAccount.setName(components, accountID, name);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(string memory name) public notPaused returns (bytes memory) {
    return execute(abi.encode(name));
  }
}
