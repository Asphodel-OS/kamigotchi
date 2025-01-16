// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { ISystem } from "../interfaces/ISystem.sol";
import { IWorld } from "../interfaces/IWorld.sol";
import { Ownable } from "solady/auth/Ownable.sol";
import { IUint256Component } from "../interfaces/IUint256Component.sol";
import { addressToEntity, entityToAddress, getAddrByID } from "../utils.sol";
import { SYSTEMS_COMPONENT_ID } from "../constants.sol";
import { System } from "../System.sol";

enum RegisterType {
  Component,
  System
}

uint256 constant ID = uint256(keccak256("world.system.register"));

contract RegisterSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(
    address msgSender,
    RegisterType registerType,
    address addr,
    uint256 id
  ) public returns (bytes memory) {
    return execute(abi.encode(msgSender, registerType, addr, id));
  }

  function execute(bytes memory args) public returns (bytes memory) {
    (address msgSender, RegisterType registerType, address addr, uint256 id) = abi.decode(
      args,
      (address, RegisterType, address, uint256)
    );
    require(msg.sender == address(world), "system can only be called via World");
    require(
      registerType == RegisterType.Component || registerType == RegisterType.System,
      "invalid type"
    );
    require(id != 0, "invalid id");
    require(addr != address(0), "invalid address");

    IUint256Component registry = registerType == RegisterType.Component
      ? components
      : IUint256Component(getAddrByID(components, SYSTEMS_COMPONENT_ID));
    uint256 entity = addressToEntity(addr);

    require(!registry.has(entity), "entity already registered");

    uint256[] memory entitiesWithId = registry.getEntitiesWithValue(id);

    if (registerType == RegisterType.Component) {
      // components cannot be upgraded
      require(entitiesWithId.length == 0, "component already registered");
    } else {
      // systems can be upgraded
      require(
        entitiesWithId.length == 0 ||
          (entitiesWithId.length == 1 &&
            Ownable(entityToAddress(entitiesWithId[0])).owner() == msgSender),
        "system already registered and caller not owner"
      );
    }

    if (entitiesWithId.length == 1) {
      // Remove previous system
      registry.remove(entitiesWithId[0]);
    }

    registry.set(entity, id);
  }
}
