// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "./BaseTester.t.sol";

import { BareComponent } from "../BareComponent.sol";
import { TestComponent } from "./components/TestComponent.sol";

contract ComponentTest is BaseTester {
  TestComponent internal component;

  function setUp() public override {
    super.setUp();

    component = new TestComponent(address(world));
    world.registerComponent(address(component), component.ID());
  }

  function testSetAndGetValue() public {
    assertTrue(!component.has(1));
    component.set(1, abi.encode(1));
    assertTrue(component.has(1));
    assertEq(1, component.size(abi.encode(1)));
    assertEq(abi.decode(component.getRaw(1), (uint256)), 1);

    component.set(1, abi.encode(2));
    component.set(2, abi.encode(4));
    assertTrue(component.has(1));
    assertTrue(component.has(2));
    assertEq(0, component.size(abi.encode(1)));
    assertEq(1, component.size(abi.encode(2)));
    assertEq(abi.decode(component.getRaw(1), (uint256)), 2);
    assertEq(abi.decode(component.getRaw(2), (uint256)), 4);

    bytes memory extracted = component.extractRaw(1);
    assertEq(abi.decode(extracted, (uint256)), 2);
    assertTrue(!component.has(1));
    assertEq(0, component.size(abi.encode(2)));
  }

  function testSet() public {
    uint256[] memory entities = new uint256[](2);
    entities[0] = 1;
    entities[1] = 2;
    bytes[] memory values = new bytes[](2);
    values[0] = abi.encode(1);
    values[1] = abi.encode(2);

    component.set(entities, values);
    assertTrue(component.has(1));
    assertTrue(component.has(2));
    assertEq(1, component.size(abi.encode(1)));
    assertEq(1, component.size(abi.encode(2)));
    assertEq(abi.decode(component.getRaw(entities)[0], (uint256)), 1);
    assertEq(abi.decode(component.getRaw(entities)[1], (uint256)), 2);

    values[0] = abi.encode(2);
    values[1] = abi.encode(4);
    component.set(entities, values);
    assertTrue(component.has(1));
    assertTrue(component.has(2));
    assertEq(1, component.size(abi.encode(2)));
    assertEq(1, component.size(abi.encode(4)));
    assertEq(abi.decode(component.getRaw(entities)[0], (uint256)), 2);
    assertEq(abi.decode(component.getRaw(entities)[1], (uint256)), 4);

    bytes[] memory extracted = component.extractRaw(entities);
    assertEq(abi.decode(extracted[0], (uint256)), 2);
    assertEq(abi.decode(extracted[1], (uint256)), 4);
    assertTrue(!component.has(1));
    assertTrue(!component.has(2));
    assertEq(0, component.size(abi.encode(2)));
    assertEq(0, component.size(abi.encode(4)));
  }

  function testRemove() public {
    assertTrue(!component.has(1));
    assertEq(0, component.size(abi.encode(1)));
    component.set(1, abi.encode(1));
    assertTrue(component.has(1));
    assertEq(1, component.size(abi.encode(1)));
    component.remove(1);
    assertTrue(!component.has(1));
    assertEq(0, component.size(abi.encode(1)));
  }

  function testGetEntitiesWithValue() public {
    component.set(1, abi.encode(1));
    component.set(2, abi.encode(1));
    component.set(3, abi.encode(2));

    uint256[] memory entities = component.getEntitiesWithValue(abi.encode(1));
    assertEq(entities.length, 2);
    assertEq(entities[0], 1);
    assertEq(entities[1], 2);

    entities = component.getEntitiesWithValue(abi.encode(2));
    assertEq(entities.length, 1);
    assertEq(entities[0], 3);

    entities = component.getEntitiesWithValue(abi.encode(3));
    assertEq(entities.length, 0);
  }
}
