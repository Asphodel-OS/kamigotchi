// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IWorld } from "./interfaces/IWorld.sol";
import { IComponent } from "./interfaces/IComponent.sol";

import { LibTypes } from "./LibTypes.sol";

import { OwnableWritable } from "./OwnableWritable.sol";

import { console } from "forge-std/Test.sol";
/**
 * Components are a key-value store from entity id to component value.
 * They are registered in the World and register updates to their state in the World.
 * They have an owner, who can grant write access to more addresses.
 * (Systems that want to write to a component need to be given write access first.)
 * Everyone has read access.
 */
abstract contract BareComponent is IComponent, OwnableWritable {
  error BareComponent__NotImplemented();
  error BatchOp_UnexpectedLength();
  error ZeroValueNotAllowed();

  /// @notice Reference to the World contract this component is registered in
  address internal immutable world;
  /// @notice Public identifier of this component
  uint256 public immutable id;

  /// @notice Mapping from entity id to value in this component
  mapping(uint256 => bytes) internal entityToValue;

  constructor(address _world, uint256 _id) OwnableWritable() {
    id = _id;
    world = _world;
  }

  /** @notice
   * Set the given component value for the given entity.
   * Registers the update in the World contract.
   * Can only be called by addresses with write access to this component.
   */
  /// @param entity Entity to set the value for.
  /// @param value Value to set for the given entity.
  function set(uint256 entity, bytes memory value) external override onlyWriter {
    _set(entity, value);
  }

  function set(uint256[] memory entities, bytes[] memory values) external override onlyWriter {
    _set(entities, values);
  }

  /** @notice
   * Remove the given entity from this component.
   * Registers the update in the World contract.
   * Can only be called by addresses with write access to this component.
   */
  /// @param entity Entity to remove from this component.
  function remove(uint256 entity) external override onlyWriter {
    _remove(entity);
  }

  function remove(uint256[] memory entities) external override onlyWriter {
    _remove(entities);
  }

  /** @notice
   * Gets and removes the raw value of the given entity in this component.
   */
  /// @param entity Entity to extract the raw value in this component for.
  function extractRaw(uint256 entity) external virtual override onlyWriter returns (bytes memory) {
    return _extractRaw(entity);
  }

  /** @notice
   * Gets and removes the raw values of the given entities in this component.
   */
  /// @param entities Entities to extract the raw values in this component for.
  function extractRaw(
    uint256[] memory entities
  ) external virtual override onlyWriter returns (bytes[] memory) {
    return _extractRaw(entities);
  }

  /** @notice
   * Checks if entity has value equal to the given value
   */
  function equal(uint256 entity, bytes memory value) external view virtual override returns (bool) {
    return keccak256(_getRaw(entity)) == keccak256(value);
  }

  /** @notice
   * Checks if all entities have value equal to the given value
   */
  function equal(
    uint256[] memory entities,
    bytes memory value
  ) external view virtual override returns (bool) {
    bytes32 hash = keccak256(value);
    for (uint256 i = 0; i < entities.length; i++) {
      if (keccak256(_getRaw(entities[i])) != hash) return false;
    }
    return true;
  }

  /** @notice
   * Check whether the given entity has a value in this component.
   */
  /// @param entity Entity to check whether it has a value in this component for.
  function has(uint256 entity) external view virtual override returns (bool) {
    return entityToValue[entity].length != 0;
  }

  /** @notice
   * Get the raw (abi-encoded) value of the given entity in this component.
   */
  /// @param entity Entity to get the raw value in this component for.
  function getRaw(uint256 entity) external view virtual override returns (bytes memory) {
    return _getRaw(entity);
  }

  /** @notice
   * Get multiple raw (abi-encoded) values of the given entities in this component.
   */
  /// @param entities Entities to get the raw values in this component for.
  function getRaw(
    uint256[] memory entities
  ) external view virtual override returns (bytes[] memory) {
    return _getRaw(entities);
  }

  /** Not implemented in BareComponent */
  function getEntitiesWithValue(
    bytes memory
  ) external view virtual override returns (uint256[] memory) {
    revert BareComponent__NotImplemented();
  }

  /// @notice Set the given component value for the given entity.
  /// @param entity Entity to set the value for.
  /// @param value Value to set for the given entity.
  function _set(uint256 entity, bytes memory value) internal virtual {
    if (value.length == 0) revert ZeroValueNotAllowed();

    // Store the entity's value;
    entityToValue[entity] = value;

    // Emit global event
    IWorld(world).registerComponentValueSet(entity, value);
  }

  /// @notice Set the given component value for a batch of entities.
  /// @param entities Entities to set the value for.
  /// @param values Values to set for the given entity.
  function _set(uint256[] memory entities, bytes[] memory values) internal virtual {
    if (entities.length != values.length) revert BatchOp_UnexpectedLength();

    for (uint256 i = 0; i < entities.length; i++) {
      if (values[i].length == 0) revert ZeroValueNotAllowed();
      entityToValue[entities[i]] = values[i];
    }

    IWorld currWorld = IWorld(world);
    for (uint256 i = 0; i < entities.length; i++)
      currWorld.registerComponentValueSet(entities[i], values[i]);
  }

  /// @notice Remove the given entity from this component.
  /// @param entity Entity to remove from this component.
  function _remove(uint256 entity) internal virtual {
    // Remove the entity from the mapping
    delete entityToValue[entity];

    // Emit global event
    IWorld(world).registerComponentValueRemoved(entity);
  }

  /// @notice Remove the given entities from this component.
  /// @param entities Entity to remove from this component.
  function _remove(uint256[] memory entities) internal virtual {
    for (uint256 i = 0; i < entities.length; i++) delete entityToValue[entities[i]];

    IWorld currWorld = IWorld(world);
    for (uint256 i = 0; i < entities.length; i++) {
      currWorld.registerComponentValueRemoved(entities[i]);
    }
  }

  /// @notice Gets and removes the raw value of the given entity in this component.
  /// @param entity Entity to extract the raw value in this component for.
  function _extractRaw(uint256 entity) internal virtual returns (bytes memory) {
    bytes memory value = _getRaw(entity);
    if (value.length > 0) _remove(entity);
    return value;
  }

  /// @notice Gets and removes the raw values of the given entities in this component.
  /// @param entities Entities to extract the raw values in this component for.
  function _extractRaw(uint256[] memory entities) internal virtual returns (bytes[] memory) {
    bytes[] memory values = _getRaw(entities);
    _remove(entities);
    return values;
  }

  function _getRaw(uint256 entity) internal view virtual returns (bytes memory) {
    return entityToValue[entity];
  }

  function _getRaw(uint256[] memory entities) internal view virtual returns (bytes[] memory) {
    bytes[] memory values = new bytes[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = entityToValue[entities[i]];
    return values;
  }
}
