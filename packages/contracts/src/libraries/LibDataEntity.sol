// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";

import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IsDataComponent, ID as IsDataCompID } from "components/IsDataComponent.sol";
import { IndexComponent, ID as IndexCompID } from "components/IndexComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

/* Library for data entity patterns. basically a key value store entity linked to an owner
 * Basic structure:
 * - IsDataComponent
 * - IdHolderComponent
 * - TypeComponent (key)
 * - IndexComponent (optional key)
 * - ValueComponent (value)
 */
library LibDataEntity {
  ///////////////////////
  // INTERACTIONS

  // creates a data entity owned by an account
  function create(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    string memory type_
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    setIsData(components, id);
    setHolder(components, id, holderID);
    setType(components, id, type_);
    return id;
  }

  function get(
    IUintComp components,
    uint256 holderID,
    uint256 index,
    string memory type_
  ) public view returns (uint256) {
    uint256 dataID = queryDataEntity(components, holderID, index, type_);
    return dataID == 0 ? 0 : getValue(components, dataID);
  }

  function incFor(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 index,
    string memory type_,
    uint256 amt
  ) internal {
    uint256 dataID = queryDataEntity(components, holderID, index, type_);
    if (dataID == 0) {
      dataID = create(world, components, holderID, type_);
      if (index != 0) setIndex(components, dataID, index);
    }
    _inc(components, dataID, amt);
  }

  function decFor(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 index,
    string memory type_,
    uint256 amt
  ) internal {
    uint256 dataID = queryDataEntity(components, holderID, index, type_);
    if (dataID == 0) {
      dataID = create(world, components, holderID, type_);
      if (index != 0) setIndex(components, dataID, index);
    }
    _dec(components, dataID, amt);
  }

  function setFor(
    IWorld world,
    IUintComp components,
    uint256 holderID,
    uint256 index,
    string memory type_,
    uint256 value
  ) internal {
    uint256 dataID = queryDataEntity(components, holderID, index, type_);
    if (dataID == 0) {
      dataID = create(world, components, holderID, type_);
      if (index != 0) setIndex(components, dataID, index);
    }
    setValue(components, dataID, value);
  }

  // SETTERS

  function setIsData(IUintComp components, uint256 id) internal {
    IsDataComponent(getAddressById(components, IsDataCompID)).set(id);
  }

  function setHolder(IUintComp components, uint256 id, uint256 holderID) internal {
    IdHolderComponent(getAddressById(components, IdHolderCompID)).set(id, holderID);
  }

  function setIndex(IUintComp components, uint256 id, uint256 index) internal {
    IndexComponent(getAddressById(components, IndexCompID)).set(id, index);
  }

  function setType(IUintComp components, uint256 id, string memory type_) internal {
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
  }

  function setValue(IUintComp components, uint256 id, uint256 value) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  function _inc(IUintComp components, uint256 entityID, uint256 amt) internal {
    uint256 value = getValue(components, entityID);
    setValue(components, entityID, value + amt);
  }

  function _dec(IUintComp components, uint256 entityID, uint256 amt) internal {
    uint256 value = getValue(components, entityID);
    require(value >= amt, "LibDataEntity: insufficient val");
    unchecked {
      setValue(components, entityID, value - amt);
    }
  }

  ///////////////////////
  // GETTERS

  function getValue(IUintComp components, uint256 id) internal view returns (uint256 result) {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    if (comp.has(id)) result = comp.getValue(id);
  }

  ///////////////////////
  // QUERIES

  function queryDataEntity(
    IUintComp components,
    uint256 holderID,
    uint256 index, // optional - 0 if not used
    string memory type_
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](index == 0 ? 3 : 4);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsDataCompID), "");
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

    if (index != 0) {
      fragments[3] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IndexCompID),
        abi.encode(index)
      );
    }

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }
}
