// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "./BaseTester.t.sol";

import { LibQuery } from "../LibQuery.sol";
import { QueryFragment, QueryType } from "../interfaces/Query.sol";
import { TestComponent1, TestComponent2, TestComponent3 } from "./components/TestComponent.sol";
import { PrototypeTagComponent } from "./components/PrototypeTagComponent.sol";
import { FromPrototypeComponent } from "./components/FromPrototypeComponent.sol";
import { OwnedByEntityComponent } from "./components/OwnedByEntityComponent.sol";

contract WorldTest is BaseTester {
  address payable[] internal users;

  TestComponent1 internal component1;
  TestComponent2 internal component2;
  TestComponent3 internal component3;

  PrototypeTagComponent internal prototypeTag;
  FromPrototypeComponent internal fromPrototype;
  OwnedByEntityComponent internal ownedByEntity;

  function setUp() public override {
    super.setUp();

    vm.startPrank(deployer);
    component1 = new TestComponent1(address(world));
    world.registerComponent(address(component1), component1.ID());
    component2 = new TestComponent2(address(world));
    world.registerComponent(address(component2), component2.ID());
    component3 = new TestComponent3(address(world));
    world.registerComponent(address(component3), component3.ID());
    prototypeTag = new PrototypeTagComponent(address(world));
    world.registerComponent(address(prototypeTag), prototypeTag.ID());
    fromPrototype = new FromPrototypeComponent(address(world));
    world.registerComponent(address(fromPrototype), fromPrototype.ID());
    ownedByEntity = new OwnedByEntityComponent(address(world));
    world.registerComponent(address(ownedByEntity), ownedByEntity.ID());
    vm.stopPrank();
  }

  function testInitDuplicate() public {
    vm.expectRevert();
    world.init();
  }

  function testLoad() public {
    component1.set(1, abi.encode(1));
  }
}
