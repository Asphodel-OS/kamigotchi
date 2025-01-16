// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IWorld } from "./interfaces/IWorld.sol";
import { BareComponent } from "./BareComponent.sol";

import { EnumerableSet } from "openzeppelin/utils/structs/EnumerableSet.sol";
import { LibTypes } from "./LibTypes.sol";

/**
 * Components are a key-value store from entity id to component value.
 * They are registered in the World and register updates to their state in the World.
 * They have an owner, who can grant write access to more addresses.
 * (Systems that want to write to a component need to be given write access first.)
 */
abstract contract Component is BareComponent {
  using EnumerableSet for EnumerableSet.UintSet;

  /** Reverse mapping from value to set of entities */
  mapping(bytes32 => EnumerableSet.UintSet) internal valToEntities;

  constructor(address _world, uint256 _id) BareComponent(_world, _id) {}

  /// @notice Get a list of all entities that have the specified value in this component.
  /// @param value Abi-encoded value to get the list of entities with this value for.
  function getEntitiesWithValue(
    bytes memory value
  ) external view virtual override returns (uint256[] memory) {
    return _getEntitiesWithValue(value);
  }

  /// @notice Get entity at specific index in set of entities with that value
  /// @dev This set is unordered, its just used to select an entity in said set
  /// @param value Abi-encoded value to get the list of entities with this value for.
  function getAt(bytes memory value, uint256 index) external view virtual returns (uint256) {
    return valToEntities[keccak256(value)].at(index);
  }

  /// @notice Get length of entities with value
  /// @param value Abi-encoded value to get the list of entities with this value for.
  function size(bytes memory value) external view virtual returns (uint256) {
    return valToEntities[keccak256(value)].length();
  }

  /// @inheritdoc BareComponent
  function _set(uint256 entity, bytes memory value) internal virtual override {
    bytes memory oldValue = entityToValue[entity];

    // Remove the entity from the previous reverse mapping
    if (oldValue.length > 0) valToEntities[keccak256(oldValue)].remove(entity);

    // Add the entity to the new reverse mapping
    valToEntities[keccak256(value)].add(entity);

    // Store the entity's value; Emit global event
    super._set(entity, value);
  }

  /// @inheritdoc BareComponent
  function _set(uint256[] memory entities, bytes[] memory values) internal virtual override {
    for (uint256 i = 0; i < entities.length; i++) {
      bytes memory oldValue = entityToValue[entities[i]];

      // Remove the entity from the previous reverse mapping
      if (oldValue.length > 0) valToEntities[keccak256(oldValue)].remove(entities[i]);

      // Add the entity to the new reverse mapping
      valToEntities[keccak256(values[i])].add(entities[i]);
    }

    // Store the entity's value; Emit global event
    super._set(entities, values);
  }

  /// @inheritdoc BareComponent
  function _remove(uint256 entity) internal virtual override {
    bytes memory value = entityToValue[entity];
    if (value.length == 0) return; // skip if no value

    // Remove the entity from the reverse mapping
    valToEntities[keccak256(value)].remove(entity);

    // Remove the entity from the mapping; Emit global event
    super._remove(entity);
  }

  /// @inheritdoc BareComponent
  function _remove(uint256[] memory entities) internal virtual override {
    for (uint256 i = 0; i < entities.length; i++) {
      bytes memory value = entityToValue[entities[i]];
      if (value.length == 0) continue; // skip if no value

      // Remove the entity from the reverse mapping
      valToEntities[keccak256(value)].remove(entities[i]);
    }

    // Remove the entities from the mapping; Emit global event
    super._remove(entities);
  }

  function _getEntitiesWithValue(
    bytes memory value
  ) internal view virtual returns (uint256[] memory) {
    return valToEntities[keccak256(value)].values();
  }
}
