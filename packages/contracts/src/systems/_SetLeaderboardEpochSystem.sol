// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Leaderboard.Epoch"));

contract _SetLeaderboardEpochSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    uint256 epoch = abi.decode(arguments, (uint256));

    LibScore.setLeaderboardEpoch(components, epoch);

    return "";
  }

  function executeTyped(uint256 epoch) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(epoch));
  }
}
