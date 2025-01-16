// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { DSTestPlus } from "solmate/test/utils/DSTestPlus.sol";
import { Vm } from "forge-std/Vm.sol";
import { console } from "forge-std/console.sol";

import { World } from "../World.sol";
import { IUint256Component } from "../interfaces/IUint256Component.sol";

contract BaseTester is DSTestPlus {
  Vm internal immutable vm = Vm(HEVM_ADDRESS);

  address deployer;
  World internal world;
  IUint256Component internal components;

  function setUp() public virtual {
    deployer = address(this);
    vm.startPrank(deployer);
    world = new World();
    world.init();
    vm.stopPrank();
  }
}
