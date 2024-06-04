// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { ISystem } from "solecs/interfaces/ISystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

// import { _ConfigSetSystem, ID as _ConfigSetSystemID } from "systems/_ConfigSetSystem.sol";

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

  // function call2(uint256 deployerPriv, address worldAddr) external returns (bytes memory) {
  //   _setUp(worldAddr);
  //   vm.startBroadcast(deployerPriv);
  //   return
  //     _call(
  //       "system.Account.Register",
  //       hex"00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000046e616d6500000000000000000000000000000000000000000000000000000000"
  //     );
  // }

  // function callConfig(uint256 deployerPriv, address worldAddr) external returns (bytes memory) {
  //   _setUp(worldAddr);
  //   vm.startBroadcast(deployerPriv);
  //   return
  //     _ConfigSetSystem(_getSysAddr(_ConfigSetSystemID)).execute(
  //       hex"000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000004d2000000000000000000000000000000000000000000000000000000000000000b434f4e4649475f4e414d45000000000000000000000000000000000000000000"
  //     );
  // }

  //////////////
  // INTERNAL

  // _system(_getSysAddr(systemID)).function(args);

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

  function _getSysAddr(string memory systemID) internal returns (address addr) {
    return _getSysAddr(uint256(keccak256(abi.encodePacked(systemID))));
  }

  /// sets up contract with world, components and system registry
  function _setUp(address worldAddr) internal {
    world = IWorld(worldAddr);
    systems = world.systems();
    components = world.components();
  }
}
