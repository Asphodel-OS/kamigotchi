// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IWorld } from "./interfaces/IWorld.sol";
import { IUint256Component } from "./interfaces/IUint256Component.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { addressToEntity, getIdByAddress } from "./utils.sol";
import { COMPONENTS_COMPONENT_ID, SYSTEMS_COMPONENT_ID } from "./constants.sol";

import { Uint256Component } from "./components/Uint256Component.sol";
import { RegisterSystem, ID as REGISTER_SYSTEM_ID, RegisterType } from "./systems/RegisterSystem.sol";

/** @notice
 * The `World` contract is at the core of every on-chain world.
 * Components register updates to their state via the `registerComponentValueSet`
 * and `registerComponentValueRemoved` methods, which emit the `ComponentValueSet` and `ComponentValueRemoved` events respectively.
 *
 * Clients can reconstruct the entire state (of all components) by listening to
 * these two events, instead of having to add a separate getter or event listener
 * for every type of data. (Have a look at the MUD network package for a TypeScript
 * implementation of contract/client state sync.)
 */
contract World is IWorld, Ownable {
  uint256 private nonce;

  Uint256Component private _components;
  Uint256Component private _systems;
  RegisterSystem public register;

  /// @dev a temp upgradable address for testing emittable events on world
  /// no state logic, out of audit scope
  address public _emitter;

  event ComponentRegistered(uint256 indexed componentId, address indexed component);

  event SystemRegistered(uint256 indexed systemId, address indexed system);

  event EmitterUpdated(address indexed emitter);

  event ComponentValueSet(
    uint256 indexed componentId,
    address indexed component,
    uint256 indexed entity,
    bytes data
  );

  event ComponentValueRemoved(
    uint256 indexed componentId,
    address indexed component,
    uint256 indexed entity
  );

  constructor() {
    _initializeOwner(msg.sender);

    // setting up registry components
    // NOTE: registry components map(address -> ID). To switch this?
    _components = new Uint256Component(address(this), COMPONENTS_COMPONENT_ID);
    _systems = new Uint256Component(address(this), SYSTEMS_COMPONENT_ID);

    // setting up registry system
    register = new RegisterSystem(this, address(_components));
    _systems.authorizeWriter(address(register));
    _components.authorizeWriter(address(register));
  }

  /** @notice
   * Initialize the World.
   * Separated from the constructor to prevent circular dependencies.
   */
  function init() public {
    _registerComponent(address(_components), COMPONENTS_COMPONENT_ID);
    _registerComponent(address(_systems), SYSTEMS_COMPONENT_ID);
    _registerSystem(address(register), REGISTER_SYSTEM_ID);
  }

  /** @notice
   * Get the component registry Uint256Component (comp addr => comp id)
   */
  function components() public view returns (IUint256Component) {
    return _components;
  }

  /** @notice
   * Get the system registry Uint256Component (sys addr => sys id)
   */
  function systems() public view returns (IUint256Component) {
    return _systems;
  }

  /** @notice
   * Update the emitter contract address.
   */
  function updateEmitter(address emitter) public onlyOwner {
    _emitter = emitter;
    emit EmitterUpdated(emitter);
  }

  /** @notice
   * Register a new component in this World.
   * ID must be unique.
   */
  function registerComponent(address addr, uint256 id) public onlyOwner {
    _registerComponent(addr, id);
  }

  /** @notice
   * Register a new system in this World.
   * ID must be unique.
   */
  function registerSystem(address addr, uint256 id) public onlyOwner {
    _registerSystem(addr, id);
  }

  /** @notice
   * Register a component value update.
   * Emits the `ComponentValueSet` event for clients to reconstruct the state.
   */
  /// @dev can only be called by component
  function registerComponentValueSet(uint256 entity, bytes calldata data) public {
    // getIdByAddress has implicit existence check
    emit ComponentValueSet(getIdByAddress(_components, msg.sender), msg.sender, entity, data);
  }

  /** @notice
   * Register a component value removal.
   * Emits the `ComponentValueRemoved` event for clients to reconstruct the state.
   */
  /// @dev can only be called by component
  function registerComponentValueRemoved(uint256 entity) public {
    // getIdByAddress has implicit existence check
    emit ComponentValueRemoved(getIdByAddress(_components, msg.sender), msg.sender, entity);
  }

  /** @notice
   * Get a unique entity ID.
   */
  /// @dev can only be called by system
  function getUniqueEntityId() public returns (uint256) {
    if (!_systems.has(addressToEntity(msg.sender))) revert("system not registered");
    return uint256(keccak256(abi.encodePacked(++nonce)));
  }

  function _registerComponent(address addr, uint256 id) internal {
    register.execute(abi.encode(msg.sender, RegisterType.Component, addr, id));
    emit ComponentRegistered(id, addr);
  }

  function _registerSystem(address addr, uint256 id) internal {
    register.execute(abi.encode(msg.sender, RegisterType.System, addr, id));
    emit SystemRegistered(id, addr);
  }
}
