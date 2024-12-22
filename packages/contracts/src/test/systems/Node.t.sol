// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "tests/utils/SetupTemplate.t.sol";

contract NodeTest is SetupTemplate {
  uint internal aKamiID;
  uint internal bKamiID;

  function setUp() public override {
    super.setUp();

    aKamiID = _mintKami(alice);
    bKamiID = _mintKami(bob);

    _fastForward(_idleRequirement);
  }

  function setUpNodes() public override {}

  /////////////////
  // TESTS

  function testNodeShape() public {
    vm.startPrank(deployer);
    // create node
    uint256 nodeID = __NodeRegistrySystem.create(
      abi.encode(1, "HARVEST", 1, "Test Node", "this is a node", "NORMAL")
    );
    // add requirement
    __NodeRegistrySystem.addRequirement(abi.encode(1, "ROOM", "BOOL_IS", 1, 0, "ACCOUNT"));
    vm.stopPrank();

    // try starting basic harvest
    _startHarvest(aKamiID, nodeID);

    // delete all
    vm.prank(deployer);
    __NodeRegistrySystem.remove(1);
  }

  function testNodeRequirementsPet() public {
    // setup
    uint32 nodeIndex = 1;
    uint256 nodeID = _createHarvestingNode(nodeIndex, 1, "Test Node", "this is a node", "NORMAL");
    _createNodeRequirement(nodeIndex, "LEVEL", "CURR_MIN", 0, 2, "KAMI");

    // cannot add level 1 pet to node
    assertFalse(LibNode.checkReqs(components, nodeIndex, alice.id, aKamiID));
    vm.prank(alice.operator);
    vm.expectRevert("node reqs not met");
    _HarvestStartSystem.executeTyped(aKamiID, nodeID);

    // leveling up
    _setLevel(aKamiID, 2);

    // can now add level 2 pet to node
    assertTrue(LibNode.checkReqs(components, nodeIndex, alice.id, aKamiID));
    _startHarvest(aKamiID, nodeID);
  }

  function testNodeRequirementsAccount() public {
    // setup
    uint32 nodeIndex = 1;
    uint256 nodeID = _createHarvestingNode(nodeIndex, 1, "Test Node", "this is a node", "NORMAL");
    _createNodeRequirement(nodeIndex, "LEVEL", "CURR_MIN", 0, 2, "ACCOUNT");
    _createNodeRequirement(nodeIndex, "ROOM", "BOOL_IS", 1, 0, "ACCOUNT");

    // cannot add level 1 account to node
    assertFalse(LibNode.checkReqs(components, nodeIndex, alice.id, aKamiID));
    vm.prank(alice.operator);
    vm.expectRevert("node reqs not met");
    _HarvestStartSystem.executeTyped(aKamiID, nodeID);

    // leveling up
    _setLevel(alice.id, 2);

    // can now add level 2 account to node
    assertTrue(LibNode.checkReqs(components, nodeIndex, alice.id, aKamiID));
    _startHarvest(aKamiID, nodeID);
  }

  function testNodeRequirementsPetAndAccount() public {
    // setup
    uint32 nodeIndex = 1;
    uint256 nodeID = _createHarvestingNode(nodeIndex, 1, "Test Node", "this is a node", "NORMAL");
    _createNodeRequirement(nodeIndex, "LEVEL", "CURR_MIN", 0, 2, "ACCOUNT");
    _createNodeRequirement(nodeIndex, "ROOM", "BOOL_IS", 1, 0, "ACCOUNT");
    _createNodeRequirement(nodeIndex, "LEVEL", "CURR_MIN", 0, 2, "KAMI");

    // cannot add, level 1 acc and pet
    assertFalse(LibNode.checkReqs(components, nodeIndex, alice.id, aKamiID));
    vm.prank(alice.operator);
    vm.expectRevert("node reqs not met");
    _HarvestStartSystem.executeTyped(aKamiID, nodeID);

    // leveling up pet
    _setLevel(aKamiID, 2);

    // cannot add, level 1 acc but level 2 pet
    assertFalse(LibNode.checkReqs(components, nodeIndex, alice.id, aKamiID));
    vm.prank(alice.operator);
    vm.expectRevert("node reqs not met");
    _HarvestStartSystem.executeTyped(aKamiID, nodeID);

    // leveling up account
    _setLevel(alice.id, 2);

    // all good
    assertTrue(LibNode.checkReqs(components, nodeIndex, alice.id, aKamiID));
    _startHarvest(aKamiID, nodeID);
  }
}
