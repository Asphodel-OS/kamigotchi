// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "./BaseTester.t.sol";

import { IWorld } from "../interfaces/IWorld.sol";
import { System } from "../System.sol";

contract SampleSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {}

  function executeTyped() external returns (bytes memory) {
    return execute(abi.encode(""));
  }

  // Note: These two getter functions are necessary to access the vars of SampleSystem
  function getWorld() public view returns (IWorld) {
    return world;
  }

  function getComponents() public view returns (IUint256Component) {
    return components;
  }
}

contract SystemTest is BaseTester {
  IUint256Component public systems;
  SampleSystem system;

  function setUp() public override {
    super.setUp();

    components = world.components();
    systems = world.systems();

    system = new SampleSystem(world, address(components));
  }

  function testSystemStorage() public {
    assertEq(address(system.getWorld()), address(world));
    assertEq(address(system.getComponents()), address(components));
  }
}
