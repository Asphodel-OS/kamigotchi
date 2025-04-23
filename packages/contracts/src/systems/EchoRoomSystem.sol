// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibEcho } from "libraries/LibEcho.sol";

uint256 constant ID = uint256(keccak256("system.echo.room"));

contract EchoRoomSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    LibEcho.room(components, accID);

    return new bytes(0);
  }

  function executeTyped() public returns (bytes memory) {
    return execute(new bytes(0));
  }
}
