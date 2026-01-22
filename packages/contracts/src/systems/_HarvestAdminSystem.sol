// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibNode } from "libraries/LibNode.sol";
import { AuthRoles } from "libraries/utils/AuthRoles.sol";

uint256 constant ID = uint256(keccak256("system.harvest.admin"));

// admin controls for harvest operations
contract _HarvestAdminSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  // index is kami index
  function stop(uint32 index) public onlyAdmin(components) returns (bytes memory) {
    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    uint256 kamiID = LibKami.genID(index);
    uint256 id = LibKami.getHarvest(components, kamiID); // harvest ID

    LibHarvest.verifyIsHarvest(components, id);
    LibKami.verifyState(components, kamiID, "HARVESTING");
    LibKami.sync(components, kamiID);
    _stop(id, accID, kamiID);
    return "";
  }

  // naive batched execution - todo: optimize
  function stopBatched(
    uint32[] memory indices // kami indices
  ) public onlyAdmin(components) {
    for (uint256 i; i < indices.length; i++) stop(indices[i]);
  }

  ////////////////
  // INTERNALS

  function _stop(uint256 harvestID, uint256 accID, uint256 kamiID) internal onlyAdmin(components) {
    // stop harvest and reset states
    LibHarvest.stop(components, harvestID, kamiID);
    LibKami.setState(components, kamiID, "RESTING");
    LibKami.resetCooldown(components, kamiID);

    // reset action bonuses
    LibBonus.resetUponHarvestStop(components, kamiID);

    // standard logging and tracking
    uint256 nodeID = LibHarvest.getNode(components, harvestID);
    uint32 nodeIndex = LibNode.getIndex(components, nodeID);
    LibHarvest.emitLog(world, "HARVEST_STOP", 0, kamiID, nodeIndex, 0);
  }

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
