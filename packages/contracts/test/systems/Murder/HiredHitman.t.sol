// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

contract HiredHitmanTest is SetupTemplate {
  uint internal nodeID;
  uint internal aKamiID;
  uint internal bKamiID;
  uint internal cKamiID;

  function setUp() public override {
    super.setUp();

    aKamiID = _mintKami(alice);
    bKamiID = _mintKami(bob);
    cKamiID = _mintKami(charlie);
    nodeID = _createHarvestingNode(1, 1, "Test Node", "this is a node", "NORMAL");

    _fastForward(_idleRequirement);
  }

  function setUpNodes() public override {}

  /// @notice sets up a victim by placing a kami on a node and farm for 10h
  function setUpVictim(uint256 victimID) internal returns (uint256 prodID) {
    prodID = _startHarvestByNodeID(victimID, nodeID);
    _fastForward(10 hours);
  }

  /// @notice enters and liquidates a victim
  function snipeVictim(uint256 attackerID, uint256 victimProdID) internal returns (uint256 prodID) {
    prodID = _startHarvestByNodeID(attackerID, nodeID);
    _fastForward(_idleRequirement);
    _liquidateHarvest(attackerID, victimProdID);
  }

  /////////////////
  // TESTS

  function testHitmanLiquidateMin() public {
    // setup quest
    _createQuest(1, 0);
    _createQuestObjective(1, "CURR_MIN", "LIQUIDATE_TOTAL", 0, 1);
    _acceptQuest(alice, 1);

    // bob places pet, left to farm and die
    uint256 bProdID = setUpVictim(bKamiID);

    // bob places pet, commits a crime
    snipeVictim(aKamiID, bProdID);

    // check and complete quest
    assertEq(1, LibData.get(components, alice.id, 0, "LIQUIDATE_TOTAL"), "log mismatch");
    _completeQuest(alice, 1);
  }

  function testHitmanVictim() public {
    // setup quest
    _createQuest(1, 0);
    _createQuestObjective(1, "CURR_MIN", "LIQUIDATED_VICTIM", 0, 1);
    _acceptQuest(bob, 1);
    _acceptQuest(charlie, 1);

    // bob places pet, left to farm and die
    uint256 bProdID = setUpVictim(bKamiID);

    // alice places pet, commits a crime
    snipeVictim(aKamiID, bProdID);

    // check and complete quest
    assertEq(1, LibData.get(components, bob.id, 0, "LIQUIDATED_VICTIM"), "victim log mismatch");
    _completeQuest(bob, 1);

    // check incomplete quest
    assertEq(
      0,
      LibData.get(components, charlie.id, 0, "LIQUIDATED_VICTIM"),
      "bystander log mismatch"
    );
  }

  /// @notice test account targeting
  /// @dev charlie.index + 1 because Tests start from 0, but accIndex from 1. to fix
  function testHitmanTargetedAttack() public {
    // setup quest
    _createQuest(1, 0);
    _createQuestObjective(1, "CURR_MIN", "LIQ_TARGET_ACC", charlie.index + 1, 1);
    _acceptQuest(alice, 1);

    // bob places pet, left to farm and die
    uint256 bProdID = setUpVictim(bKamiID);

    // alice places pet, commits a crime
    snipeVictim(aKamiID, bProdID);

    // wrong target check
    assertEq(
      0,
      LibData.get(components, alice.id, charlie.index + 1, "LIQ_TARGET_ACC"),
      "bystander log mismatch"
    );

    // alice tries again
    uint256 aKamiID2 = _mintKami(alice);
    uint256 cProdID = setUpVictim(cKamiID);
    snipeVictim(aKamiID2, cProdID);

    // check and complete quest
    assertEq(
      1,
      LibData.get(components, alice.id, charlie.index + 1, "LIQ_TARGET_ACC"),
      "target log mismatch"
    );
    _completeQuest(alice, 1);
  }
}
