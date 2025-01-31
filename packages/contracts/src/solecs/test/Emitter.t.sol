// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "./BaseTester.t.sol";

import { IWorld } from "../interfaces/IWorld.sol";
import { System } from "../System.sol";
import { Emitter } from "../Emitter.sol";

contract SampleSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint8[] memory _schema = new uint8[](1);
    _schema[0] = uint8(1);
    Emitter(world._emitter()).emitSystemCalled("test", _schema, bytes("hi"));
  }

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

contract EmitterTest is BaseTester {
  IUint256Component public systems;
  SampleSystem system;
  Emitter emitter;

  function setUp() public override {
    super.setUp();

    components = world.components();
    systems = world.systems();
    emitter = Emitter(world._emitter());

    system = new SampleSystem(world, address(components));
    world.registerSystem(address(system), 1);
  }

  function testEmitterPermissions() public {
    uint8[] memory _schema = new uint8[](1);
    _schema[0] = uint8(1);

    // system, expect emit
    // vm.prank(address(system));
    vm.expectEmit(address(emitter));
    emit Emitter.SystemCalled("test", _schema, bytes("hi"));
    system.executeTyped();
  }

  function testFailEmitterPermissions() public {
    uint8[] memory _schema = new uint8[](1);
    _schema[0] = uint8(1);
    // not system, expect revert
    // vm.prank(address(0));
    // vm.expectRevert();
    vm.expectEmit(address(emitter));
    emit Emitter.SystemCalled("test", _schema, bytes("hi"));
    emitter.emitSystemCalled("test", _schema, bytes("hi"));
  }
}
