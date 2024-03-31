// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { EmptyWorld } from "test/utils/EmptyWorld.t.sol";

import { BoolComponent } from "std-contracts/components/BoolComponent.sol";
import { Uint256BareComponent } from "std-contracts/components/Uint256BareComponent.sol";
import { Uint256Component } from "std-contracts/components/Uint256Component.sol";

import { LibSafeQuery } from "libraries/utils/LibSafeQuery.sol";

contract LibSafeQueryTest is EmptyWorld {
  BoolComponent isComp;
  Uint256Component uintComp;
  Uint256BareComponent uintBareComp;

  function setUp() public override {
    super.setUp();

    vm.startPrank(deployer);

    isComp = new BoolComponent(address(world), uint256(keccak256("test.Is")));
    uintComp = new Uint256Component(address(world), uint256(keccak256("test.Uint")));
    uintBareComp = new Uint256BareComponent(address(world), uint256(keccak256("test.UintBare")));

    vm.stopPrank();
  }

  function testIsWithValueBareFails() public {
    uint256 placeholder = 0xFFFF;
    uint256 id = world.getUniqueEntityId();
    vm.startPrank(deployer);
    isComp.set(id);
    uintBareComp.set(id, placeholder);
    uintComp.set(id, placeholder);
    vm.stopPrank();

    // test regular component
    uint256[] memory results = LibSafeQuery.getIsWithValue(
      uintComp,
      isComp,
      abi.encode(placeholder)
    );
    assertEq(results[0], id);

    // test bare component
    vm.expectRevert();
    results = LibSafeQuery.getIsWithValue(uintBareComp, isComp, abi.encode(placeholder));
  }

  function testQuery(uint256 length, uint256 startVal, uint256 emptyVal) public {
    vm.assume(length < 500);
    vm.assume(startVal != emptyVal);
    uint256 searchFor = startVal;
    uint256 targetID = world.getUniqueEntityId();
    vm.prank(deployer);
    uintComp.set(targetID, searchFor);

    // create entities
    for (uint256 i = 0; i < length; i++) {
      uint256 val = uint256(keccak256(abi.encode(searchFor, i)));
      if (val != emptyVal && val != searchFor) {
        vm.startPrank(deployer);
        uint256 id = world.getUniqueEntityId();
        isComp.set(id);
        uintComp.set(id, val);
        vm.stopPrank();
      }
    }

    // test search without isComp
    uint256[] memory results = LibSafeQuery.getIsWithValue(uintComp, isComp, abi.encode(searchFor));
    assertEq(results.length, 0);

    // test search with isComp
    vm.prank(deployer);
    isComp.set(targetID);
    results = LibSafeQuery.getIsWithValue(uintComp, isComp, abi.encode(searchFor));
    assertEq(results[0], targetID);

    // test search with isComp and emptyVal
    results = LibSafeQuery.getIsWithValue(uintComp, isComp, abi.encode(emptyVal));
    assertEq(results.length, 0);
  }
}
