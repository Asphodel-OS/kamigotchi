// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IWorld } from "./interfaces/IWorld.sol";
import { IUint256Component } from "./interfaces/IUint256Component.sol";
import { Uint256Component } from "./components/Uint256Component.sol";
import { addressToEntity, getIdByAddress } from "./utils.sol";
import { componentsComponentId, systemsComponentId } from "./constants.sol";
import { RegisterSystem, ID as registerSystemId, RegisterType } from "./systems/RegisterSystem.sol";

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
contract World is IWorld {
  uint256 private nonce;

  Uint256Component private _components;
  Uint256Component private _systems;
  RegisterSystem public register;

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
    _components = new Uint256Component(address(0), componentsComponentId);
    _systems = new Uint256Component(address(0), systemsComponentId);
    register = new RegisterSystem(this, address(_components));
    _systems.authorizeWriter(address(register));
    _components.authorizeWriter(address(register));
  }

  /** @notice
   * Initialize the World.
   * Separated from the constructor to prevent circular dependencies.
   */
  function init() public {
    _components.registerWorld(address(this));
    _systems.registerWorld(address(this));
    register.execute(
      abi.encode(msg.sender, RegisterType.System, address(register), registerSystemId)
    );
  }

  /** @notice
   * Get the component registry Uint256Component
   * (mapping from component address to component id)
   */
  function components() public view returns (IUint256Component) {
    return _components;
  }

  /** @notice
   * Get the system registry Uint256Component
   * (mapping from system address to system id)
   */
  function systems() public view returns (IUint256Component) {
    return _systems;
  }

  /** @notice
   * Register a new component in this World.
   * ID must be unique.
   */
  function registerComponent(address componentAddr, uint256 id) public {
    register.execute(abi.encode(msg.sender, RegisterType.Component, componentAddr, id));
  }

  /** @notice
   * Register a new system in this World.
   * ID must be unique.
   */
  function registerSystem(address systemAddr, uint256 id) public {
    register.execute(abi.encode(msg.sender, RegisterType.System, systemAddr, id));
  }

  /** @notice
   * Register a component value update.
   * Emits the `ComponentValueSet` event for clients to reconstruct the state.
   */
  function registerComponentValueSet(uint256 entity, bytes calldata data) public {
    require(_components.has(addressToEntity(msg.sender)), "component not registered");
    emit ComponentValueSet(getIdByAddress(_components, msg.sender), msg.sender, entity, data);
  }

  /** @notice
   * Register a component value removal.
   * Emits the `ComponentValueRemoved` event for clients to reconstruct the state.
   */
  function registerComponentValueRemoved(uint256 entity) public {
    require(_components.has(addressToEntity(msg.sender)), "component not registered");
    emit ComponentValueRemoved(getIdByAddress(_components, msg.sender), msg.sender, entity);
  }

  /** @notice
   * Get a unique entity ID.
   */
  function getUniqueEntityId() public returns (uint256) {
    return uint256(keccak256(abi.encodePacked(++nonce)));
  }
}
