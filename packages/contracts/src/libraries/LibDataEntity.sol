// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";

import { IdAccountComponent, ID as IdAccountCompID } from "components/IdAccountComponent.sol";
import { IdPetComponent, ID as IdPetCompID } from "components/IdPetComponent.sol";
import { IsDataComponent, ID as IsDataCompID } from "components/IsDataComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

/* Library for data entity patterns. basically a key value store entity linked to an owner
 * Basic structure:
 * - IsDataComponent
 * - Owner Entity (e.g IdAccount, IdPet)
 * - TypeComponent (key)
 * - Any component to attatch (default: value)
 */
library LibDataEntity {
  ///////////////////////
  // INTERACTIONS

  // creates a data entity owned by an account
  function createForAccount(
    IWorld world,
    IUintComp components,
    uint256 accountID,
    string memory type_
  ) internal returns (uint256) {
    require(
      getAccountDataEntity(components, accountID, type_) == 0,
      "LibDataEntity: data alr exists"
    );
    uint256 id = world.getUniqueEntityId();
    IsDataComponent(getAddressById(components, IsDataCompID)).set(id);
    IdAccountComponent(getAddressById(components, IdAccountCompID)).set(id, accountID);
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
    return id;
  }

  // creates a data entity owned by a pet
  function createForPet(
    IWorld world,
    IUintComp components,
    uint256 petID,
    string memory type_
  ) internal returns (uint256) {
    require(getPetDataEntity(components, petID, type_) == 0, "LibDataEntity: data alr exists");
    uint256 id = world.getUniqueEntityId();
    IsDataComponent(getAddressById(components, IsDataCompID)).set(id);
    IdPetComponent(getAddressById(components, IdPetCompID)).set(id, petID);
    TypeComponent(getAddressById(components, TypeCompID)).set(id, type_);
    return id;
  }

  // sets an existing data entity owned by an account
  function setForAccount(IUintComp components, uint256 id, uint256 value) internal {
    require(id != 0, "LibDataEntity: data doesnt exist");
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  // sets an existing data entity owned by a pet
  function setForPet(IUintComp components, uint256 id, uint256 value) internal {
    require(id != 0, "LibDataEntity: data doesnt exist");
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
