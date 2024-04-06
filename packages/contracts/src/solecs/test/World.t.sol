// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { DSTest } from "ds-test/test.sol";
import { Vm } from "forge-std/Vm.sol";
import { console } from "forge-std/console.sol";

import { World } from "../World.sol";
import { LibQuery } from "../LibQuery.sol";
import { QueryFragment, QueryType } from "../interfaces/Query.sol";
import { TestComponent1, TestComponent2, TestComponent3 } from "./components/TestComponent.sol";
import { PrototypeTagComponent } from "./components/PrototypeTagComponent.sol";
import { FromPrototypeComponent } from "./components/FromPrototypeComponent.sol";
import { OwnedByEntityComponent } from "./components/OwnedByEntityComponent.sol";

contract WorldTest is DSTest {
  Vm internal immutable vm = Vm(HEVM_ADDRESS);

  address payable[] internal users;

  World internal world;

  TestComponent1 internal component1;
  TestComponent2 internal component2;
  TestComponent3 internal component3;

  PrototypeTagComponent internal prototypeTag;
  FromPrototypeComponent internal fromPrototype;
  OwnedByEntityComponent internal ownedByEntity;

  function setUp() public {
    world = new World();
    world.init();
    address worldAddress = address(world);
    component1 = new TestComponent1(worldAddress);
    component2 = new TestComponent2(worldAddress);
    component3 = new TestComponent3(worldAddress);
    prototypeTag = new PrototypeTagComponent(worldAddress);
    fromPrototype = new FromPrototypeComponent(worldAddress);
    ownedByEntity = new OwnedByEntityComponent(worldAddress);
  }

  function testLoad() public {
    component1.set(1, abi.encode(1));
  }
}
