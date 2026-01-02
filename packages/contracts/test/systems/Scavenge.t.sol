// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";
import { Vm } from "forge-std/Vm.sol";

struct ScavBarData {
  uint256 id; // registry id
  string field;
  uint32 index;
  string affinity;
  uint256 tierCost;
}

contract ScavengeTest is SetupTemplate {
  ScavBarData public scavbar1;

  function setUp() public override {
    super.setUp();

    // create basic empty scavbar
    scavbar1 = _createScavBar("TEST", 1, "NORMAL", 5);
  }

  function testScavShape() public {
    ScavBarData memory bar1 = _createScavBar("teST", 1, "NORMAL", 5);
    assertEq(bar1.id, LibScavenge.genRegID("TEST", 1), "scav bar id mismatch");
  }

  function testScavPoints(uint256 amt) public {
    _incFor(alice, scavbar1, amt);
    _assertPoints(alice, scavbar1, amt);

    uint256 numTiers = _extractNumTiers(alice, scavbar1);
    assertEq(numTiers, amt / scavbar1.tierCost, "num tiers mismatch");
    _assertPoints(alice, scavbar1, amt % scavbar1.tierCost);
  }

  // skip heavy reward checks - those done in Reward.t.sol
  function testScavClaim() public {
    uint256 amt = 10; // total items to be distributed = 10 scav tiers
    _addReward(scavbar1.id, "ITEM", 1, 1);

    _incFor(alice, scavbar1, amt * scavbar1.tierCost + 3);
    _claim(alice, scavbar1.id);

    assertEq(_getItemBal(alice, 1), amt, "item balance mismatch");
    _assertPoints(alice, scavbar1, 3);
  }

  function testScavNodeClaim(uint256 scavCost, uint256 scavScore) public {
    vm.assume(scavCost > 0 && scavScore > 0);
    uint32 nodeIndex = 1;
    vm.prank(deployer);
    uint256 scavBarID = __NodeRegistrySystem.addScavenge(nodeIndex, scavCost);

    // setup kami on node
    uint256 kamiID = _mintKami(alice);
    uint256 harvestID = _startHarvest(kamiID, nodeIndex);
    _incHarvestBounty(harvestID, scavScore);
    _fastForward(_idleRequirement);
    _stopHarvest(harvestID);

    // claim scav
    uint256 expectedRolls = scavScore / scavCost;
    uint256 expectedRemainder = scavScore % scavCost;
    uint256 scavInstanceID = LibScavenge.genInstanceID("NODE", nodeIndex, alice.id);
    assertEq(_ValueComponent.get(scavInstanceID), scavScore, "instance points mismatch");
    if (expectedRolls == 0) {
      vm.prank(alice.operator);
      vm.expectRevert();
      _ScavengeClaimSystem.executeTyped(scavBarID);
    } else {
      _claim(alice, scavBarID);
      assertEq(
        _ValueComponent.get(scavInstanceID),
        expectedRemainder,
        "post roll scav points mismatch"
      );
    }
  }

  /////////////////
  // ACTIONS

  function _claim(PlayerAccount memory acc, uint256 scavID) internal {
    vm.prank(acc.operator);
    _ScavengeClaimSystem.executeTyped(scavID);
  }

  /////////////////
  // UTILS

  function _incFor(PlayerAccount memory acc, ScavBarData memory scavBar, uint256 amt) internal {
    vm.startPrank(deployer);
    LibScavenge.incFor(components, scavBar.field, scavBar.index, amt, acc.id);
    vm.stopPrank();
  }

  function _extractNumTiers(
    PlayerAccount memory acc,
    ScavBarData memory scavBar
  ) internal returns (uint256) {
    vm.startPrank(deployer);
    uint256 numTiers = LibScavenge.extractNumTiers(
      components,
      scavBar.id,
      testToBaseStruct(scavBar),
      acc.id
    );
    vm.stopPrank();
    return numTiers;
  }

  function _createScavBar(
    string memory field,
    uint32 index,
    string memory affinity,
    uint256 tierCost
  ) internal returns (ScavBarData memory) {
    vm.startPrank(deployer);
    uint256 id = LibScavenge.create(components, LibScavenge.Base(field, index, affinity), tierCost);
    vm.stopPrank();
    return ScavBarData(id, field, index, affinity, tierCost);
  }

  function _addReward(
    uint256 scavBarID,
    string memory type_,
    uint32 rwdIndex,
    uint256 value
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    uint256 anchorID = LibScavenge.genAlloAnchor(scavBarID);
    id = LibAllo.createBasic(components, scavBarID, anchorID, type_, rwdIndex, value);
    vm.stopPrank();
  }

  function _addReward(
    uint256 scavBarID,
    uint32[] memory keys,
    uint256[] memory weights,
    uint256 value
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    uint256 anchorID = LibScavenge.genAlloAnchor(scavBarID);
    id = LibAllo.createDT(components, scavBarID, anchorID, keys, weights, value);
    vm.stopPrank();
  }

  function testToBaseStruct(
    ScavBarData memory data
  ) internal pure returns (LibScavenge.Base memory) {
    return LibScavenge.Base(data.field, data.index, data.affinity);
  }

  /////////////////
  // ASSERTIONS

  function _assertPoints(
    PlayerAccount memory acc,
    ScavBarData memory scavBar,
    uint256 amt
  ) internal view {
    uint256 instanceID = LibScavenge.genInstanceID(scavBar.field, scavBar.index, acc.id);
    uint256 curr = _ValueComponent.get(instanceID);
    assertEq(curr, amt, "scav points mismatch");
  }

  /////////////////
  // EVENT TESTING

  /// @notice Helper to find WorldEvent in recorded logs
  function _findWorldEvent(
    Vm.Log[] memory logs,
    string memory identifier
  ) internal pure returns (Vm.Log memory) {
    bytes32 identifierHash = keccak256(bytes(identifier));
    for (uint i = 0; i < logs.length; i++) {
      if (logs[i].topics.length > 0 && logs[i].topics[1] == identifierHash) {
        return logs[i];
      }
    }
    revert("WorldEvent not found");
  }

  /// @notice Helper to decode SCAVENGE_REWARDS event data
  function _decodeScavengeRewardsEvent(
    bytes memory data
  )
    internal
    pure
    returns (
      uint256 regID,
      string memory scavengeType,
      uint32 nodeIndex,
      uint256 holderID,
      uint256 timestamp,
      string[] memory rewardTypes,
      uint32[] memory rewardIndices,
      uint256[] memory rewardAmounts,
      uint256[] memory commitIDs
    )
  {
    // Skip schema array decoding, decode the values directly
    (, bytes memory values) = abi.decode(data, (uint8[], bytes));
    return
      abi.decode(
        values,
        (uint256, string, uint32, uint256, uint256, string[], uint32[], uint256[], uint256[])
      );
  }

  /// @notice Helper to decode DROPTABLE_REVEAL event data
  function _decodeDroptableRevealEvent(
    bytes memory data
  )
    internal
    pure
    returns (
      uint256 commitID,
      uint256 holderID,
      uint256 dtID,
      uint256 timestamp,
      uint32[] memory itemIndices,
      uint256[] memory itemAmounts
    )
  {
    // Skip schema array decoding, decode the values directly
    (, bytes memory values) = abi.decode(data, (uint8[], bytes));
    return abi.decode(values, (uint256, uint256, uint256, uint256, uint32[], uint256[]));
  }
  
  /// @notice Test SCAVENGE_REWARDS event with droptable rewards
  function testScavengeRewardsEventWithDroptable() public {
    // Setup: create scavbar with droptable reward
    uint256 amt = 5;
    uint32[] memory keys = new uint32[](2);
    keys[0] = 1;
    keys[1] = 2;
    uint256[] memory weights = new uint256[](2);
    weights[0] = 50;
    weights[1] = 50;
    uint256 rolls = 3;

    _addReward(scavbar1.id, keys, weights, rolls);
    _incFor(alice, scavbar1, amt * scavbar1.tierCost);

    // Record logs and claim
    vm.recordLogs();
    _claim(alice, scavbar1.id);
    Vm.Log[] memory logs = vm.getRecordedLogs();

    // Find and decode SCAVENGE_REWARDS event
    Vm.Log memory eventLog = _findWorldEvent(logs, "SCAVENGE_REWARDS");
    (
      uint256 regID,
      string memory scavengeType,
      uint32 nodeIndex,
      uint256 holderID,
      uint256 timestamp,
      string[] memory rewardTypes,
      uint32[] memory rewardIndices,
      uint256[] memory rewardAmounts,
      uint256[] memory commitIDs
    ) = _decodeScavengeRewardsEvent(eventLog.data);

    // Assertions
    assertEq(regID, scavbar1.id, "regID mismatch");
    assertEq(scavengeType, "TEST", "scavengeType mismatch");
    assertEq(holderID, alice.id, "holderID mismatch");
    assertEq(rewardTypes.length, 1, "rewardTypes length mismatch");
    assertEq(rewardTypes[0], "ITEM_DROPTABLE", "reward type should be ITEM_DROPTABLE");
    assertEq(rewardAmounts[0], rolls * amt, "reward amount (rolls) mismatch");
    assertEq(commitIDs.length, 1, "commitIDs length mismatch");
    assertTrue(commitIDs[0] != 0, "commitID should be non-zero for droptable");
  }

  /// @notice Test DROPTABLE_REVEAL event
  function testDroptableRevealEvent() public {
    // Setup: create scavbar with droptable, claim to create commit
    uint256 amt = 2;
    uint32[] memory keys = new uint32[](2);
    keys[0] = 10;
    keys[1] = 20;
    uint256[] memory weights = new uint256[](2);
    weights[0] = 80;
    weights[1] = 20;
    uint256 rolls = 1;

    _addReward(scavbar1.id, keys, weights, rolls);
    _incFor(alice, scavbar1, amt * scavbar1.tierCost);

    // Claim to create commits
    vm.recordLogs();
    _claim(alice, scavbar1.id);
    Vm.Log[] memory claimLogs = vm.getRecordedLogs();
    Vm.Log memory scavEventLog = _findWorldEvent(claimLogs, "SCAVENGE_REWARDS");
    (, , , , , , , , uint256[] memory commitIDs) = _decodeScavengeRewardsEvent(
      scavEventLog.data
    );

    // Advance block to allow reveal
    vm.roll(block.number + 2);

    // Reveal and record logs
    vm.recordLogs();
    vm.prank(alice.operator);
    _DroptableRevealSystem.executeTyped(commitIDs);
    Vm.Log[] memory revealLogs = vm.getRecordedLogs();

    // Find and decode DROPTABLE_REVEAL event
    Vm.Log memory revealEventLog = _findWorldEvent(revealLogs, "DROPTABLE_REVEAL");
    (
      uint256 commitID,
      uint256 holderID,
      uint256 dtID,
      uint256 timestamp,
      uint32[] memory itemIndices,
      uint256[] memory itemAmounts
    ) = _decodeDroptableRevealEvent(revealEventLog.data);

    // Assertions
    assertEq(commitID, commitIDs[0], "commitID mismatch");
    assertEq(holderID, alice.id, "holderID mismatch");
    assertTrue(dtID != 0, "dtID should be non-zero");
    assertEq(timestamp, block.timestamp, "timestamp mismatch");
    assertEq(itemIndices.length, keys.length, "itemIndices length mismatch");
    assertEq(itemAmounts.length, keys.length, "itemAmounts length mismatch");
    
    // Verify total items distributed equals rolls * amt
    uint256 totalItems = 0;
    for (uint i = 0; i < itemAmounts.length; i++) {
      totalItems += itemAmounts[i];
    }
    assertEq(totalItems, rolls * amt, "total items distributed mismatch");
  }

  /// @notice Test full event flow: SCAVENGE_REWARDS → DROPTABLE_REVEAL
  function testFullEventFlow() public {
    // Setup: create scavbar with mixed rewards (basic item + droptable)
    uint256 amt = 3;
    
    // Add basic item reward
    uint32 basicItemIndex = 100;
    uint256 basicItemValue = 10;
    _addReward(scavbar1.id, "ITEM", basicItemIndex, basicItemValue);
    
    // Add droptable reward
    uint32[] memory keys = new uint32[](3);
    keys[0] = 1;
    keys[1] = 2;
    keys[2] = 3;
    uint256[] memory weights = new uint256[](3);
    weights[0] = 60;
    weights[1] = 30;
    weights[2] = 10;
    uint256 rolls = 2;
    _addReward(scavbar1.id, keys, weights, rolls);
    
    _incFor(alice, scavbar1, amt * scavbar1.tierCost);

    // Step 1: Claim and verify SCAVENGE_REWARDS event
    vm.recordLogs();
    _claim(alice, scavbar1.id);
    Vm.Log[] memory claimLogs = vm.getRecordedLogs();
    
    Vm.Log memory scavEventLog = _findWorldEvent(claimLogs, "SCAVENGE_REWARDS");
    (
      ,
      ,
      ,
      ,
      ,
      string[] memory rewardTypes,
      ,
      uint256[] memory rewardAmounts,
      uint256[] memory commitIDs
    ) = _decodeScavengeRewardsEvent(scavEventLog.data);

    // Verify mixed rewards in SCAVENGE_REWARDS
    assertEq(rewardTypes.length, 2, "should have 2 reward types");
    assertEq(rewardTypes[0], "ITEM", "first reward should be ITEM");
    assertEq(rewardTypes[1], "ITEM_DROPTABLE", "second reward should be ITEM_DROPTABLE");
    assertEq(rewardAmounts[0], basicItemValue * amt, "basic item amount mismatch");
    assertEq(rewardAmounts[1], rolls * amt, "droptable rolls mismatch");
    assertEq(commitIDs[0], 0, "basic item should have no commitID");
    assertTrue(commitIDs[1] != 0, "droptable should have commitID");

    // Verify basic item was distributed immediately
    assertEq(_getItemBal(alice, basicItemIndex), basicItemValue * amt, "basic item not distributed");

    // Step 2: Reveal and verify DROPTABLE_REVEAL event
    vm.roll(block.number + 2);
    
    uint256[] memory revealsArray = new uint256[](1);
    revealsArray[0] = commitIDs[1];
    
    vm.recordLogs();
    vm.prank(alice.operator);
    _DroptableRevealSystem.executeTyped(revealsArray);
    Vm.Log[] memory revealLogs = vm.getRecordedLogs();

    Vm.Log memory revealEventLog = _findWorldEvent(revealLogs, "DROPTABLE_REVEAL");
    (uint256 commitID, , , , , uint256[] memory itemAmounts) = _decodeDroptableRevealEvent(
      revealEventLog.data
    );

    // Verify commitID matches
    assertEq(commitID, commitIDs[1], "commitID should match between events");
    
    // Verify droptable items were distributed
    uint256 totalDropItems = 0;
    for (uint i = 0; i < itemAmounts.length; i++) {
      totalDropItems += itemAmounts[i];
    }
    assertEq(totalDropItems, rolls * amt, "droptable items total mismatch");
  }
}
