// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";

uint256 constant ID = uint256(keccak256("system.test.comp.event"));

/// @notice for test world, to trigger and set a ValueUpdate component event. used as workaround to refresh indexer
contract _TriggerCompEventSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    TimeStartComponent(getAddrByID(components, TimeStartCompID)).set(1, uint32(block.timestamp));

    return new bytes(0);
  }

  function executeTyped() public returns (bytes memory) {
    return execute(new bytes(0));
  }
}
