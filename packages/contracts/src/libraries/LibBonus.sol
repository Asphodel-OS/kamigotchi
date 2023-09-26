// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IsBonusComponent, ID as IsBonusCompID } from "components/IsBonusComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";

import { LibStat } from "libraries/LibStat.sol";

library LibBonus {
  /////////////////
  // INTERACTIONS
  function create(IWorld world, IUintComp components, uint256 holderID) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsBonusComponent(getAddressById(components, IsBonusCompID)).set(id);
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
    return id;
  }

  function incStat(IUintComp components, uint256 id, string memory type_, uint256 value) internal {
    uint256 currVal = getStat(components, id, type_);
    setStat(components, id, type_, currVal + value);
  }

  // NOTE: this does not fail gracefully when value > currVal. need to consider how best to handle
  function decStat(IUintComp components, uint256 id, string memory type_, uint256 value) internal {
    uint256 currVal = getStat(components, id, type_);
    setStat(components, id, type_, currVal - value);
  }

  /////////////////
  // GETTERS

  function getStat(
    IUintComp components,
    uint256 id,
    string memory type_
  ) internal view returns (uint256) {
    if (LibString.eq(type_, "HEALTH")) return LibStat.getHealth(components, id);
    if (LibString.eq(type_, "POWER")) return LibStat.getPower(components, id);
    if (LibString.eq(type_, "HARMONY")) return LibStat.getHarmony(components, id);
    if (LibString.eq(type_, "VIOLENCE")) return LibStat.getViolence(components, id);
    if (LibString.eq(type_, "SLOTS")) return LibStat.getSlots(components, id);
    return 0;
  }

  /////////////////
  // SETTERS

  function setStat(IUintComp components, uint256 id, string memory type_, uint256 value) internal {
    if (LibString.eq(type_, "HEALTH")) LibStat.setHealth(components, id, value);
    else if (LibString.eq(type_, "POWER")) LibStat.setPower(components, id, value);
    else if (LibString.eq(type_, "HARMONY")) LibStat.setHarmony(components, id, value);
    else if (LibString.eq(type_, "VIOLENCE")) LibStat.setViolence(components, id, value);
    else if (LibString.eq(type_, "SLOTS")) LibStat.setSlots(components, id, value);
  }

  /////////////////
  // QUERIES

  function getByHolder(
    IUintComp components,
    uint256 holderID
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsBonusCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdHolderCompID),
      abi.encode(holderID)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }
}
