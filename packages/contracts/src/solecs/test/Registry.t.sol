// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "./BaseTester.t.sol";

import { BareComponent } from "../BareComponent.sol";
import { System } from "../System.sol";
import { TestComponent } from "./components/TestComponent.sol";
import { IWorld } from "../interfaces/IWorld.sol";
import { IUint256Component } from "../interfaces/IUint256Component.sol";
import { getAddrByID } from "../utils.sol";

contract RegistryTest is BaseTester {
  function testComponentDuplicate() public {
    TestComponent comp = new TestComponent(address(world));
    uint256 id = comp.ID();
    world.registerComponent(address(comp), id);

    TestComponent comp2 = new TestComponent(address(world));
    vm.expectRevert();
    world.registerComponent(address(comp2), id);

    vm.expectRevert();
    world.registerComponent(address(11), id);
  }

  function testSystemUpgrade() public {
    uint256 id = uint256(keccak256("system.test"));

    vm.prank(deployer);
    SampleSystem system = new SampleSystem(world, address(components));

    // not owner, cannot upgrade
    vm.prank(address(1));
    SampleSystem system2 = new SampleSystem(world, address(components));
    vm.prank(address(1));
    vm.expectRevert();
    world.registerSystem(address(system2), id);

    // upgrade owner
    vm.prank(deployer);
    SampleSystem system3 = new SampleSystem(world, address(components));
    vm.prank(deployer);
    world.registerSystem(address(system3), id);
    assertEq(address(system3), getAddrByID(world.systems(), id));
  }
}

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
