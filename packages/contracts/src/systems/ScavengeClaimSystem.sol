// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibScavenge } from "libraries/LibScavenge.sol";

uint256 constant ID = uint256(keccak256("system.scavenge.claim"));

contract ScavengeClaimSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 scavBarID = abi.decode(arguments, (uint256));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // implicit existence check
    (string memory scavField, uint32 scavIndex) = LibScavenge.getMetadata(components, scavBarID);

    // get amt of rewards and distribute
    uint256 count = LibScavenge.extractNumTiers(components, scavBarID, scavField, scavIndex, accID);
    if (count == 0)
      revert("no scav rolls. node modal may be out of sync, showing already claimed rolls");
    LibScavenge.distributeRewards(world, components, scavBarID, count, accID);

    // standard logging and tracking
    LibScavenge.logClaim(components, scavField, scavIndex, count, accID);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
