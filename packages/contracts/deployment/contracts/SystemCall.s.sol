// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { ISystem } from "solecs/interfaces/ISystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { BoolComponent } from "solecs/components/BoolComponent.sol";
import { Uint32Component } from "solecs/components/Uint32Component.sol";
import { StringComponent } from "solecs/components/StringComponent.sol";

// import { _ConfigSetSystem, ID as _ConfigSetSystemID } from "systems/_ConfigSetSystem.sol";

import "forge-std/Script.sol";

contract SystemCall is Script {
  mapping(uint256 => address) public worldAddrs; // for both components and systems

  IWorld internal world;
  IUintComp internal systems;
  IUintComp internal components;

  function call(
    uint256 deployerPriv,
    address worldAddr,
    uint256 systemID,
    bytes memory args
  ) external returns (bytes memory) {
    _setUp(worldAddr);
    vm.startBroadcast(deployerPriv);
    return _call(systemID, args);
  }

  //////////////
  // INTERNAL

  function _call(uint256 systemID, bytes memory args) public returns (bytes memory) {
    return _getSys(systemID).execute(args);
  }

  function _call(string memory systemID, bytes memory args) public returns (bytes memory) {
    return _getSys(systemID).execute(args);
  }

  function _getBoolComp(string memory id) public returns (BoolComponent) {
    return BoolComponent(_getCompAddr(id));
  }

  function _getUintComp(string memory id) public returns (IUintComp) {
    return IUintComp(_getCompAddr(id));
  }

  function _getUint32Comp(string memory id) public returns (Uint32Component) {
    return Uint32Component(_getCompAddr(id));
  }

  function _getStringComp(string memory id) public returns (StringComponent) {
    return StringComponent(_getCompAddr(id));
  }

  function _getSys(uint256 systemID) internal returns (ISystem) {
    return ISystem(_getSysAddr(systemID));
  }

  function _getSys(string memory systemID) internal returns (ISystem) {
    return ISystem(_getSysAddr(systemID));
  }

  function _getCompAddr(uint256 componentID) internal returns (address addr) {
    addr = worldAddrs[componentID];
    if (addr == address(0)) {
      addr = getAddrByID(components, componentID);
      worldAddrs[componentID] = addr;
    }
  }

  function _getCompAddr(string memory componentID) internal returns (address addr) {
    return _getCompAddr(uint256(keccak256(abi.encodePacked(componentID))));
  }

  function _getSysAddr(uint256 systemID) internal returns (address addr) {
    addr = worldAddrs[systemID];
    if (addr == address(0)) {
      addr = getAddrByID(systems, systemID);
      worldAddrs[systemID] = addr;
    }
  }

  function _getSysAddr(string memory systemID) internal returns (address addr) {
    return _getSysAddr(uint256(keccak256(abi.encodePacked(systemID))));
  }

  /// sets up contract with world, components and system registry
  function _setUp(address worldAddr) internal virtual {
    world = IWorld(worldAddr);
    systems = world.systems();
    components = world.components();
  }
}
