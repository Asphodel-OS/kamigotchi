// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { IdNodeComponent, ID as IdNodeCompID } from "components/IdNodeComponent.sol";
import { IdSourceComponent, ID as IdSourceCompID } from "components/IdSourceComponent.sol";
import { IdTargetComponent, ID as IdTargetCompID } from "components/IdTargetComponent.sol";
import { IndexNodeComponent, ID as IndexNodeCompID } from "components/IndexNodeComponent.sol";
import { IsKillComponent, ID as IsKillCompID } from "components/IsKillComponent.sol";
import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { CoinComponent, ID as CoinCompID } from "components/CoinComponent.sol";
import { TimeComponent, ID as TimeCompID } from "components/TimeComponent.sol";

import { LibNode } from "libraries/LibNode.sol";

// a Kill Entity is an event log tracking where, when and with whom a killing took place
library LibKill {
  // creates a kill log. pretty sure we don't need to do anything with the library aside from this
  function create(
    IWorld world,
    IUintComp components,
    uint256 sourceID,
    uint256 targetID,
    uint256 nodeID,
    uint256 balance,
    uint256 bounty
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsKillComponent(getAddressById(components, IsKillCompID)).set(id);
    IdSourceComponent(getAddressById(components, IdSourceCompID)).set(id, sourceID);
    IdTargetComponent(getAddressById(components, IdTargetCompID)).set(id, targetID);
    IdNodeComponent(getAddressById(components, IdNodeCompID)).set(id, nodeID);
    IndexNodeComponent(getAddressById(components, IndexNodeCompID)).set(
      id,
      LibNode.getIndex(components, nodeID)
    );

    BalanceComponent(getAddressById(components, BalanceCompID)).set(id, balance);
    CoinComponent(getAddressById(components, CoinCompID)).set(id, bounty);
    TimeComponent(getAddressById(components, TimeCompID)).set(id, block.timestamp);
    return id;
  }
}
