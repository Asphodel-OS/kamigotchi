// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { IdNodeComponent, ID as IdNodeCompID } from "components/IdNodeComponent.sol";
import { IdSourceComponent, ID as IdSourceCompID } from "components/IdSourceComponent.sol";
import { IdTargetComponent, ID as IdTargetCompID } from "components/IdTargetComponent.sol";
import { IsKillComponent, ID as IsKillCompID } from "components/IsKillComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";

// a Kill Entity is an event log tracking where, when and with whom a killing took place
library LibKill {
  // creates a kill log. pretty sure we don't need to do anything with the library aside from this
  function create(
    IWorld world,
    IUintComp components,
    uint256 sourceID,
    uint256 targetID,
    uint256 nodeID
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsKillComponent(getAddressById(components, IsKillCompID)).set(id);
    IdSourceComponent(getAddressById(components, IdSourceCompID)).set(id, sourceID);
    IdTargetComponent(getAddressById(components, IdTargetCompID)).set(id, targetID);
    IdNodeComponent(getAddressById(components, IdNodeCompID)).set(id, nodeID);
    TimeComponent(getAddressById(components, TimeCompID)).set(id, block.timestamp);
    return id;
  }
}
