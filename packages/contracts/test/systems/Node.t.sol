// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

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
    uint32 nodeIndex = 1;
    uint256 nodeID = __NodeRegistrySystem.create(
      abi.encode(nodeIndex, "HARVEST", 1, 1, "Test Node", "this is a node", "NORMAL")
    );
    // add requirement
    __NodeRegistrySystem.addRequirement(abi.encode(1, "ROOM", "BOOL_IS", 1, 0, "ACCOUNT"));
    vm.stopPrank();

    // try starting basic harvest
    _startHarvest(aKamiID, nodeIndex);

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
    assertFalse(checkNodeRequirements(nodeIndex, alice.id, aKamiID));
    vm.prank(alice.operator);
    vm.expectRevert("node reqs not met");
    _HarvestStartSystem.executeTyped(aKamiID, nodeIndex, 0, 0);

    // leveling up
    _setLevel(aKamiID, 2);

    // can now add level 2 pet to node
    assertTrue(checkNodeRequirements(nodeIndex, alice.id, aKamiID));
    _startHarvest(aKamiID, nodeIndex);
  }

  function testNodeRequirementsAccount() public {
    // setup
    uint32 nodeIndex = 1;
    uint256 nodeID = _createHarvestingNode(nodeIndex, 1, "Test Node", "this is a node", "NORMAL");
    _createNodeRequirement(nodeIndex, "LEVEL", "CURR_MIN", 0, 2, "ACCOUNT");
    _createNodeRequirement(nodeIndex, "ROOM", "BOOL_IS", 1, 0, "ACCOUNT");

    // cannot add level 1 account to node
    assertFalse(checkNodeRequirements(nodeIndex, alice.id, aKamiID));
    vm.prank(alice.operator);
    vm.expectRevert("node reqs not met");
    _HarvestStartSystem.executeTyped(aKamiID, nodeIndex, 0, 0);

    // leveling up
    _setLevel(alice.id, 2);

    // can now add level 2 account to node
    assertTrue(checkNodeRequirements(nodeIndex, alice.id, aKamiID));
    _startHarvest(aKamiID, nodeIndex);
  }

  function testNodeRequirementsPetAndAccount() public {
    // setup
    uint32 nodeIndex = 1;
    uint256 nodeID = _createHarvestingNode(nodeIndex, 1, "Test Node", "this is a node", "NORMAL");
    _createNodeRequirement(nodeIndex, "LEVEL", "CURR_MIN", 0, 2, "ACCOUNT");
    _createNodeRequirement(nodeIndex, "ROOM", "BOOL_IS", 1, 0, "ACCOUNT");
    _createNodeRequirement(nodeIndex, "LEVEL", "CURR_MIN", 0, 2, "KAMI");

    // cannot add, level 1 acc and pet
    assertFalse(checkNodeRequirements(nodeIndex, alice.id, aKamiID));
    vm.prank(alice.operator);
    vm.expectRevert("node reqs not met");
    _HarvestStartSystem.executeTyped(aKamiID, nodeIndex, 0, 0);

    // leveling up pet
    _setLevel(aKamiID, 2);

    // cannot add, level 1 acc but level 2 pet
    assertFalse(checkNodeRequirements(nodeIndex, alice.id, aKamiID));
    vm.prank(alice.operator);
    vm.expectRevert("node reqs not met");
    _HarvestStartSystem.executeTyped(aKamiID, nodeIndex, 0, 0);

    // leveling up account
    _setLevel(alice.id, 2);

    // all good
    assertTrue(checkNodeRequirements(nodeIndex, alice.id, aKamiID));
    _startHarvest(aKamiID, nodeIndex);
  }

  //////////////
  // UTILS

  function _createNodeRequirement(
    uint32 nodeIndex,
    string memory type_,
    string memory logicType,
    uint32 index,
    uint256 value,
    string memory for_
  ) internal returns (uint) {
    vm.prank(deployer);
    return
      __NodeRegistrySystem.addRequirement(
        abi.encode(nodeIndex, type_, logicType, index, value, for_)
      );
  }

  function checkNodeRequirements(
    uint32 nodeIndex,
    uint256 accID,
    uint256 kamiID
  ) internal view returns (bool) {
    uint256[] memory reqIDs = LibNode.getReqs(components, nodeIndex);
    if (reqIDs.length == 0) return true;

    return LibConditional.check(components, reqIDs, kamiID);
  }
}
