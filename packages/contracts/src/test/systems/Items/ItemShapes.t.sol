// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "tests/utils/SetupTemplate.t.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract ItemShapeTest is SetupTemplate {
  function setUp() public override {
    super.setUp();

    vm.roll(_currBlock++);
  }

  function setUpItems() public override {}

  /////////////////
  // TESTS

  function testItemShapeEmpty() public {
    uint32 index = 1;
    vm.startPrank(deployer);
    __ItemRegistrySystem.create(abi.encode(index, "FOOD", "name", "description", "media"));

    __ItemRegistrySystem.remove(index);
    vm.stopPrank();
  }

  function testItemShapeRequirements() public {
    uint32 index = 1;
    vm.startPrank(deployer);
    __ItemRegistrySystem.create(abi.encode(index, "FOOD", "name", "description", "media"));
    __ItemRegistrySystem.addRequirement(abi.encode(index, "USE", "type", "BOOL_IS", 1, 0));
    __ItemRegistrySystem.addRequirement(abi.encode(index, "BURN", "type", "BOOL_IS", 1, 0));
    __ItemRegistrySystem.addRequirement(abi.encode(index, "BURN", "type", "BOOL_IS", 2, 0));
    vm.stopPrank();

    // check reference existence
    assertEq(LibItem.getAllReferences(components, index).length, 2, "reference count mismatch");
    assertTrue(_IDParentComponent.has(LibReference.genID("USE", LibItem.genRefParentID(index))));
    assertTrue(_IDParentComponent.has(LibReference.genID("BURN", LibItem.genRefParentID(index))));

    // check requirement existence
    assertEq(LibItem.getAllRequirements(components, index).length, 3, "total req count mismatch");
    assertEq(LibItem.getReqsFor(components, index, "USE").length, 1, "use req count mismatch");
    assertEq(LibItem.getReqsFor(components, index, "BURN").length, 2, "burn req count mismatch");

    // deletion
    vm.prank(deployer);
    __ItemRegistrySystem.remove(index);

    // check removals
    assertEq(LibItem.getAllReferences(components, index).length, 0, "deleted ref count mismatch");
    assertEq(LibItem.getAllRequirements(components, index).length, 0, "deleted req count mismatch");
  }
}
