// SPDX-License-Identifier: AGPL-3.0-only
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

    // checks
    LibScavenge.verifyIsScavenge(components, scavBarID);
    LibScavenge.Base memory scavData = LibScavenge.getBase(components, scavBarID);

    // get amt of rewards and distribute
    uint256 rolls = LibScavenge.extractNumTiers(components, scavBarID, scavData, accID);
    if (rolls == 0)
      revert("no scav rolls. node modal may be out of sync, showing already claimed rolls");
    LibScavenge.distributeRewards(world, components, scavBarID, rolls, accID);

    // standard logging and tracking
    LibScavenge.logClaim(components, scavData, rolls, accID);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
