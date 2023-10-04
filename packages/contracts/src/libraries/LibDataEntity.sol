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
    uint256 accountID,
    string memory type_
  ) internal returns (uint256) {
    require(queryDataEntity(components, accountID, type_) == 0, "LibDataEntity: data alr exists");
    uint256 id = world.getUniqueEntityId();
    IsDataComponent(getAddressById(components, IsDataCompID)).set(id);
    IdHolderComponent(getAddressById(components, IdAccountCompID)).set(id, accountID);
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
    return id;
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

  ///////////////////////
  // GETTERS

  function getValue(IUintComp components, uint256 id) internal view returns (uint256 result) {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    if (comp.has(id)) result = comp.getValue(id);
  }

  ///////////////////////
  // QUERIES

  function getAccountData(
    IUintComp components,
    uint256 accountID,
    string memory type_
  ) internal view returns (uint256) {
    uint256 dataID = getAccountDataEntity(components, accountID, type_);
    return getValue(components, dataID);
  }

  function getPetData(
    IUintComp components,
    uint256 petID,
    string memory type_
  ) internal view returns (uint256) {
    uint256 dataID = getPetDataEntity(components, petID, type_);
    return getValue(components, dataID);
  }

  function getAccountDataEntity(
    IUintComp components,
    uint256 accountID,
    string memory type_
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsDataCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdAccountCompID),
      abi.encode(accountID)
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, TypeCompID),
      abi.encode(type_)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }

  function getPetDataEntity(
    IUintComp components,
    uint256 petID,
    string memory type_
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsDataCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdPetCompID),
      abi.encode(petID)
    );
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, TypeCompID),
      abi.encode(type_)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length != 0) result = results[0];
  }
}
