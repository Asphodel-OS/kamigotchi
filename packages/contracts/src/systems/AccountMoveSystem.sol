// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.Account.Move"));

// moves the account to a valid room location
contract AccountMoveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 to = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);

    require(LibAccount.syncStamina(components, accountID) != 0, "Account: out of stamina");
    require(LibAccount.canMoveTo(components, accountID, to), "Account: unreachable location");

    LibAccount.move(components, accountID, to);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 to) public returns (bytes memory) {
    return execute(abi.encode(to));
  }
}
