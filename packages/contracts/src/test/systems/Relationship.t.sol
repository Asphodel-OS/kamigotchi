// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

import { LibRegistryRelationship as LibRegRel } from "libraries/LibRegistryRelationship.sol";

struct RSIndexPair {
  uint32 npc;
  uint32 rel;
}

contract RelationshipTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function testCreateRS(RSIndexPair memory index) public {
    vm.assume(index.npc != 0);
    vm.assume(index.rel != 0);
    vm.assume(index.npc != 111 && index.rel != 111); // generic number reserved for not check

    // set up relationships
    _createNPC(index.npc, 1, "testNPC");
    uint256 regID = _createRelationship(index.npc, index.rel);
    assertEq(LibRegRel.get(components, index.npc, index.rel), regID);
    assertTrue(_IsRegistryComponent.has(regID));
    assertTrue(_IsRelationshipComponent.has(regID));
    assertEq(index.npc, _IndexNPCComponent.getValue(regID));
    assertEq(index.rel, _IndexRelationshipComponent.getValue(regID));

    // get() on empty relationship should return 0
    assertEq(LibRegRel.get(components, 111, 111), 0);
    assertEq(LibRelationship.get(components, _getAccount(0), index.npc, index.rel), 0);

    // check relationship black/whitelist
    assertFalse(LibRelationship.isBlacklisted(components, _getAccount(0), regID));
    assertTrue(LibRelationship.isWhitelisted(components, _getAccount(0), regID));

    // check accept relationship
    uint256 rsID = _advRelationship(0, index.npc, index.rel);
    assertEq(LibRelationship.get(components, _getAccount(0), index.npc, index.rel), rsID);
    assertTrue(_IsRelationshipComponent.has(rsID));
    assertEq(_IdOwnsRelationshipComponent.getValue(rsID), _getAccount(0));
    assertEq(_IndexNPCComponent.getValue(rsID), index.npc);
    assertEq(_IndexRelationshipComponent.getValue(rsID), index.rel);

    // check repeat acceptance
    vm.prank(_getOperator(0));
    vm.expectRevert("RS: flag already obtained");
    _RelationshipAdvanceSystem.executeTyped(index.npc, index.rel);

    // check fake npc
    vm.prank(_getOperator(0));
    vm.expectRevert("RS: npc does not exist");
    _RelationshipAdvanceSystem.executeTyped(111, index.rel);

    // check fake flag
    vm.prank(_getOperator(0));
    vm.expectRevert("RS: flag does not exist");
    _RelationshipAdvanceSystem.executeTyped(index.npc, 111);
  }

  function testBlacklistedRS(
    bool listed,
    RSIndexPair memory listIndex,
    RSIndexPair memory tarIndex
  ) public {
    vm.assume(listIndex.npc != 0 && tarIndex.npc != 0);
    vm.assume(listIndex.rel != 0 && tarIndex.rel != 0);
    vm.assume(listIndex.npc == tarIndex.npc);
    vm.assume(listIndex.rel != tarIndex.rel);

    // create relationship
    _createNPC(listIndex.npc, 1, "testNPC");
    if (listIndex.npc != tarIndex.npc) _createNPC(tarIndex.npc, 1, "testNPC2");
    uint256 tarRegID;
    uint256 listRegID = _createRelationship(listIndex.npc, listIndex.rel);
    if (listed) {
      uint32[] memory blacklist = new uint32[](1);
      blacklist[0] = listIndex.rel;
      tarRegID = _createRelationship(tarIndex.npc, tarIndex.rel, "", new uint32[](0), blacklist);
    } else tarRegID = _createRelationship(tarIndex.npc, tarIndex.rel);

    // check no blacklist yet
    assertFalse(LibRelationship.isBlacklisted(components, _getAccount(0), tarRegID));

    // accept listed relationship
    _advRelationship(0, listIndex.npc, listIndex.rel);

    // check blacklist
    assertEq(listed, LibRelationship.isBlacklisted(components, _getAccount(0), tarRegID));

    // try accept
    vm.prank(_getOperator(0));
    if (listed) vm.expectRevert("RS: prohibited from advancing");
    _RelationshipAdvanceSystem.executeTyped(tarIndex.npc, tarIndex.rel);
  }

  function testWhitelistedRS(
    bool listed,
    RSIndexPair memory listIndex,
    RSIndexPair memory tarIndex
  ) public {
    vm.assume(listIndex.npc != 0 && tarIndex.npc != 0);
    vm.assume(listIndex.rel != 0 && tarIndex.rel != 0);
    vm.assume(listIndex.npc == tarIndex.npc);
    vm.assume(listIndex.rel != tarIndex.rel);

    // create relationship
    _createNPC(listIndex.npc, 1, "testNPC");
    if (listIndex.npc != tarIndex.npc) _createNPC(tarIndex.npc, 1, "testNPC2");
    uint256 tarRegID;
    uint256 listRegID = _createRelationship(listIndex.npc, listIndex.rel);
    if (listed) {
      uint32[] memory whitelist = new uint32[](1);
      whitelist[0] = listIndex.rel;
      tarRegID = _createRelationship(tarIndex.npc, tarIndex.rel, "", whitelist, new uint32[](0));
    } else tarRegID = _createRelationship(tarIndex.npc, tarIndex.rel);

    // check no whitelist yet
    assertEq(!listed, LibRelationship.isWhitelisted(components, _getAccount(0), tarRegID));

    // try accept
    vm.prank(_getOperator(0));
    if (listed) vm.expectRevert("RS: unmet requirements");
    _RelationshipAdvanceSystem.executeTyped(tarIndex.npc, tarIndex.rel);

    // accept listed relationship
    _advRelationship(0, listIndex.npc, listIndex.rel);
    assertTrue(LibRelationship.has(components, _getAccount(0), listIndex.npc, listIndex.rel));

    // check whitelist
    assertTrue(LibRelationship.isWhitelisted(components, _getAccount(0), tarRegID));

    // finally accept
    if (listed) _advRelationship(0, tarIndex.npc, tarIndex.rel);
  }

  ///////////////
  // UTILS

  function isEqual(RSIndexPair memory a, RSIndexPair memory b) internal pure returns (bool) {
    return a.npc == b.npc && a.rel == b.rel;
  }
}
