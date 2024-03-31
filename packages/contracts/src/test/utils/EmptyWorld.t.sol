// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Test, console } from "forge-std/Test.sol";

import { World } from "solecs/World.sol";
import { BareComponent } from "solecs/BareComponent.sol";
import { Component } from "solecs/Component.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

contract EmptyWorld is Test {
  address internal deployer = address(111);
  World world;

  function setUp() public virtual {
    vm.startPrank(deployer);
    world = new World();
    world.init();

    vm.stopPrank();
  }
}
