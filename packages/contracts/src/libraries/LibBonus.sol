// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IsBonusComponent, ID as IsBonusCompID } from "components/IsBonusComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibStat } from "libraries/LibStat.sol";

library LibBonus {
  /////////////////
  // INTERACTIONS
  function create(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    string memory _type
  ) public returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsBonusComponent(getAddressById(components, IsBonusCompID)).set(id);
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
    TypeComponent(getAddressById(components, TypeCompID)).set(id, _type);
    return id;
  }

  function inc(IUintComp components, uint256 id, uint256 amt) public {
    uint256 curr = getValue(components, id);
    setValue(components, id, curr + amt);
  }

  function dec(IUintComp components, uint256 id, uint256 amt) public {
    uint256 curr = getValue(components, id);
    require(curr >= amt, "LibBonus: lower limit reached");
    setValue(components, id, curr - amt);
  }

  /////////////////
  // CHECKERS

  function hasValue(IUintComp components, uint256 id) public view returns (bool) {
    return ValueComponent(getAddressById(components, ValueCompID)).has(id);
  }

  /////////////////
  // GETTERS

  // default value of bonus multipliers is 1000
  // this represents for 100.0% for percentage based bonuses
  function getValue(IUintComp components, uint256 id) public view returns (uint256) {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    if (!comp.has(id)) return 1000;
    return comp.getValue(id);
  }

  /////////////////
  // SETTERS

  function setValue(IUintComp components, uint256 id, uint256 value) public {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  /////////////////
  // QUERIES

  function get(
    IUintComp components,
    uint256 holderID,
    string memory type_
  ) public view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsBonusCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdHolderCompID),
      abi.encode(holderID)
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, TypeCompID),
      abi.encode(type_)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length > 0) result = results[0];
  }
}
