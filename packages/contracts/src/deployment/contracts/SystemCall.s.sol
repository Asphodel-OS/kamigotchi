// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { ISystem } from "solecs/interfaces/ISystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import "forge-std/Script.sol";

contract SystemCall is Script {
  mapping(uint256 => address) public systemAddrs;

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

  function _convertArrayuint256(
    bytes memory data,
    uint256 length
  ) internal returns (uint256[] memory) {
    uint256[] memory arr = new uint256[](length);
    for (uint256 i = 0; i < length; i++) {
      arr[i] = abi.decode(data, (uint256[length]))[i];
    }
    return arr;
  }

  function _convertArrayuint32(
    bytes memory data,
    uint256 length
  ) internal returns (uint32[] memory) {
    uint32[] memory arr = new uint32[](length);
    for (uint256 i = 0; i < length; i++) {
      arr[i] = abi.decode(data, (uint32[length]))[i];
    }
    return arr;
  }

  function _convertArrayint32(bytes memory data, uint256 length) internal returns (int32[] memory) {
    int32[] memory arr = new int32[](length);
    for (uint256 i = 0; i < length; i++) {
      arr[i] = abi.decode(data, (int32[length]))[i];
    }
    return arr;
  }

  function _call(uint256 systemID, bytes memory args) public returns (bytes memory) {
    return _getSys(systemID).execute(args);
  }

  function _getSys(uint256 systemID) internal returns (ISystem) {
    return ISystem(_getSysAddr(systemID));
  }

  function _getSysAddr(uint256 systemID) internal returns (address addr) {
    addr = systemAddrs[systemID];
    if (addr == address(0)) {
      addr = getAddressById(systems, systemID);
      systemAddrs[systemID] = addr;
    }
  }

  /// sets up contract with world, components and system registry
  function _setUp(address worldAddr) internal {
    world = IWorld(worldAddr);
    systems = world.systems();
    components = world.components();
  }
}
