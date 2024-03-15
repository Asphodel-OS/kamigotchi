// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Test, console } from "forge-std/Test.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { SystemStorage } from "solecs/SystemStorage.sol";
import { LibDeploy, DeployResult } from "deployment/contracts/LibDeploy.sol";

string constant mnemonic = "test test test test test test test test test test test junk";

contract MudTest is Test {
  address internal deployer;
  uint32 internal addressCounter;

  IWorld internal world;
  IUint256Component components;
  IUint256Component systems;

  constructor() {
    (deployer, ) = deriveRememberKey(mnemonic, 0);
  }

  function setUp() public virtual {
    vm.startPrank(deployer);
    DeployResult memory result = LibDeploy.deploy(deployer, address(0), false);
    world = result.world;
    vm.stopPrank();

    components = world.components();
    systems = world.systems();
    SystemStorage.init(world, components);
  }

  /////////////////
  // UTILS

  function _getNextUserAddress() internal returns (address) {
    addressCounter++;
    (address addr, ) = deriveRememberKey(mnemonic, addressCounter);
    return payable(addr);
  }

  function component(uint256 id) public view returns (address) {
    return getAddressById(components, id);
  }

  function system(uint256 id) public view returns (address) {
    return getAddressById(systems, id);
  }
}
