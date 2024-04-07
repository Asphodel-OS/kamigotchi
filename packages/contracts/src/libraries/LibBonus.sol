// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { BalanceComponent, ID as BalCompID } from "components/BalanceComponent.sol";
import { IsBonusComponent, ID as IsBonusCompID } from "components/IsBonusComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

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
    BalanceComponent comp = BalanceComponent(getAddressById(components, BalCompID));
    uint256 curr = comp.has(id) ? comp.get(id) : 0;
    comp.set(id, curr + amt);
  }

  function dec(IUintComp components, uint256 id, uint256 amt) public {
    BalanceComponent comp = BalanceComponent(getAddressById(components, BalCompID));
    uint256 curr = comp.has(id) ? comp.get(id) : 0;
    require(curr >= amt, "LibBonus: lower limit reached");
    comp.set(id, curr - amt);
  }

  /////////////////
  // CHECKERS

  function hasBalance(IUintComp components, uint256 id) public view returns (bool) {
    return BalanceComponent(getAddressById(components, BalCompID)).has(id);
  }

  /////////////////
  // GETTERS

  // default value of bonus multipliers is 1000
  // this represents for 100.0% for percentage based bonuses
  function getBalance(IUintComp components, uint256 id) public view returns (uint256) {
    BalanceComponent comp = BalanceComponent(getAddressById(components, BalCompID));
    if (!comp.has(id)) return 1000;
    return comp.get(id);
  }

  /////////////////
  // SETTERS

  function setBalance(IUintComp components, uint256 id, uint256 value) public {
    BalanceComponent(getAddressById(components, BalCompID)).set(id, value);
  }

  /////////////////
  // QUERIES

  function get(
    IUintComp components,
    uint256 holderID,
    string memory type_
  ) public view returns (uint256) {
    uint256 id = genID(holderID, type_);
    return IsBonusComponent(getAddressById(components, IsBonusCompID)).has(id) ? id : 0;
  }

  //////////////
  // UTILS

  function genID(uint256 holderID, string memory type_) public pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("bonus", holderID, type_)));
  }
}
