// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IsConfigComponent, ID as IsConfigCompID } from "components/IsConfigComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

// a config entity is a global config of field values, identified by its NameComponent
library LibConfig {
  // Create a global config field entity. Value is set separately
  function create(
    IWorld world,
    IUintComp components,
    string memory name
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsConfigComponent(getAddressById(components, IsConfigCompID)).set(id);
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
    return id;
  }

  //////////////////
  // SETTERS

  // Set the value of a global config field entity
  function setValue(IUintComp components, uint256 id, uint256 value) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(id, value);
  }

  // Packs a string value as a uint256 for a config. Max 32 chars.
  function setValueString(IUintComp components, uint256 id, string memory value) internal {
    require(bytes(value).length <= 32, "LibConfig: string too long");
    setValue(components, id, uint256(bytes32(bytes(value))));
  }

  //////////////////
  // GETTERS

  // Retrieve the value of a global config field entity
  function getValue(IUintComp components, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddressById(components, ValueCompID)).getValue(id);
  }

  // Retrieve the value of a global config field entity by name. Assume it exists.
  function getValueOf(IUintComp components, string memory name) internal view returns (uint256) {
    uint256 id = get(components, name);
    return getValue(components, id);
  }

  function getValueStringOf(
    IUintComp components,
    string memory name
  ) internal view returns (string memory) {
    return string(abi.encode(getValueOf(components, name)));
  }

  //////////////////
  // QUERIES

  // Retrieve the ID of a config with the given type
  function get(IUintComp components, string memory name) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsConfigCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, NameCompID),
      abi.encode(name)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length > 0) {
      result = results[0];
    }
  }
}
