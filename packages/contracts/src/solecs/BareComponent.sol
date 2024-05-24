// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IWorld } from "./interfaces/IWorld.sol";
import { IComponent } from "./interfaces/IComponent.sol";

import { LibTypes } from "./LibTypes.sol";

import { OwnableWritable } from "./OwnableWritable.sol";

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

  /** Reference to the World contract this component is registered in */
  address public world;

  /** Mapping from entity id to value in this component */
  mapping(uint256 => bytes) internal entityToValue;

  /** Public identifier of this component */
  uint256 public id;

  constructor(address _world, uint256 _id) {
    id = _id;
    if (_world != address(0)) registerWorld(_world);
  }

  /**
   * Register this component in the given world.
   * @param _world Address of the World contract.
   */
  function registerWorld(address _world) public onlyOwner {
    world = _world;
    IWorld(world).registerComponent(address(this), id);
  }

  /**
   * Set the given component value for the given entity.
   * Registers the update in the World contract.
   * Can only be called by addresses with write access to this component.
   * @param entity Entity to set the value for.
   * @param value Value to set for the given entity.
   */
  function set(uint256 entity, bytes memory value) public override onlyWriter {
    _set(entity, value);
  }

  function setBatch(uint256[] memory entities, bytes[] memory values) public override onlyWriter {
    _setBatch(entities, values);
  }

  /**
   * Remove the given entity from this component.
   * Registers the update in the World contract.
   * Can only be called by addresses with write access to this component.
   * @param entity Entity to remove from this component.
   */
  function remove(uint256 entity) public override onlyWriter {
    _remove(entity);
  }

  function removeBatch(uint256[] memory entities) public override onlyWriter {
    _removeBatch(entities);
  }

  /**
   * Gets and removes the raw value of the given entity in this component.
   * @param entity Entity to extract the raw value in this component for.
   */
  function extractRaw(uint256 entity) public virtual override onlyWriter returns (bytes memory) {
    return _extractRaw(entity);
  }

  /**
   * Gets and removes the raw values of the given entities in this component.
   * @param entities Entities to extract the raw values in this component for.
   */
  function extractRawBatch(
    uint256[] memory entities
  ) public virtual override onlyWriter returns (bytes[] memory) {
    return _extractRawBatch(entities);
  }

  /**
   * Check whether the given entity has a value in this component.
   * @param entity Entity to check whether it has a value in this component for.
   */
  function has(uint256 entity) public view virtual override returns (bool) {
    return entityToValue[entity].length != 0;
  }

  /**
   * Get the raw (abi-encoded) value of the given entity in this component.
   * @param entity Entity to get the raw value in this component for.
   */
  function getRaw(uint256 entity) public view virtual override returns (bytes memory) {
    return _getRaw(entity);
  }

  /**
   * Get multiple raw (abi-encoded) values of the given entities in this component.
   * @param entities Entities to get the raw values in this component for.
   */
  function getRawBatch(
    uint256[] memory entities
  ) public view virtual override returns (bytes[] memory) {
    bytes[] memory values = new bytes[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = entityToValue[entities[i]];
    return values;
  }

  /** Not implemented in BareComponent */
  function getEntities() public view virtual override returns (uint256[] memory) {
    revert BareComponent__NotImplemented();
  }

  /** Not implemented in BareComponent */
  function getEntitiesWithValue(
    bytes memory
  ) public view virtual override returns (uint256[] memory) {
    revert BareComponent__NotImplemented();
  }

  /**
   * Set the given component value for the given entity.
   * Registers the update in the World contract.
   * Can only be called internally (by the component or contracts deriving from it),
   * without requiring explicit write access.
   * @param entity Entity to set the value for.
   * @param value Value to set for the given entity.
   */
  function _set(uint256 entity, bytes memory value) internal virtual {
    if (value.length == 0) revert ZeroValueNotAllowed();

    // Store the entity's value;
    entityToValue[entity] = value;

    // Emit global event
    IWorld(world).registerComponentValueSet(entity, value);
  }

  /**
   * Set the given component value for a batch of entities.
   * Registers the update in the World contract.
   * Can only be called internally (by the component or contracts deriving from it),
   * without requiring explicit write access.
   * @param entities Entities to set the value for.
   * @param values Values to set for the given entity.
   */
  function _setBatch(uint256[] memory entities, bytes[] memory values) internal virtual {
    if (entities.length != values.length) revert BatchOp_UnexpectedLength();

    for (uint256 i = 0; i < entities.length; i++) {
      if (values[i].length == 0) revert ZeroValueNotAllowed();
      entityToValue[entities[i]] = values[i];
    }

    IWorld currWorld = IWorld(world);
    for (uint256 i = 0; i < entities.length; i++)
      currWorld.registerComponentValueSet(entities[i], values[i]);
  }

  /**
   * Remove the given entity from this component.
   * Registers the update in the World contract.
   * Can only be called internally (by the component or contracts deriving from it),
   * without requiring explicit write access.
   * @param entity Entity to remove from this component.
   */
  function _remove(uint256 entity) internal virtual {
    // Remove the entity from the mapping
    delete entityToValue[entity];

    // Emit global event
    IWorld(world).registerComponentValueRemoved(entity);
  }

  /**
   * Remove the given entities from this component.
   * Registers the update in the World contract.
   * Can only be called internally (by the component or contracts deriving from it),
   * without requiring explicit write access.
   * @param entities Entity to remove from this component.
   */
  function _removeBatch(uint256[] memory entities) internal virtual {
    for (uint256 i = 0; i < entities.length; i++) delete entityToValue[entities[i]];

    IWorld currWorld = IWorld(world);
    for (uint256 i = 0; i < entities.length; i++) {
      currWorld.registerComponentValueRemoved(entities[i]);
    }
  }

  /**
   * Gets and removes the raw value of the given entity in this component.
   * @param entity Entity to extract the raw value in this component for.
   */
  function _extractRaw(uint256 entity) internal virtual returns (bytes memory) {
    bytes memory value = _getRaw(entity);
    if (value.length > 0) _remove(entity);
    return value;
  }

  /**
   * Gets and removes the raw values of the given entities in this component.
   * @param entities Entities to extract the raw values in this component for.
   */
  function _extractRawBatch(uint256[] memory entities) internal virtual returns (bytes[] memory) {
    bytes[] memory values = _getRawBatch(entities);
    _removeBatch(entities);
    return values;
  }

  function _getRaw(uint256 entity) internal view virtual returns (bytes memory) {
    return entityToValue[entity];
  }

  function _getRawBatch(uint256[] memory entities) internal view virtual returns (bytes[] memory) {
    bytes[] memory values = new bytes[](entities.length);
    for (uint256 i = 0; i < entities.length; i++) values[i] = entityToValue[entities[i]];
    return values;
  }
}
