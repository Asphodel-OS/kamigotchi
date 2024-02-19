// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { ISystem } from "solecs/interfaces/ISystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import "forge-std/Script.sol";

// forge script src/deployment/contracts/SystemCall.s.sol:SystemCall --sig "call(address,uint256,bytes)" "0x610178dA211FEF7D417bC0e6FeD39F05609AD788" "uint256(keccak256('system._Config.Set'))" "abi.encode("name",5)"
// forge script src/deployment/contracts/SystemCall.s.sol:SystemCall --sig "call(uint256,address,uint256,bytes)" "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" "0x610178dA211FEF7D417bC0e6FeD39F05609AD788" "0x77ecdbeff66f6a1ed1858296770772bd6752009b6f5209269552793493aeed37" "0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000046e616d6500000000000000000000000000000000000000000000000000000000"

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
    IWorld world = IWorld(worldAddr);
    systems = world.systems();
    components = world.components();
  }
}
