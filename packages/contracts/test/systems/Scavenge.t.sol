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
      uint256[] memory commitIDs
    )
  {
    // Skip schema array decoding, decode the values directly
    (, bytes memory values) = abi.decode(data, (uint8[], bytes));
    return abi.decode(values, (uint256, string, uint32, uint256, uint256, uint256[]));
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
      ,
      uint256 holderID,
      ,
      uint256[] memory commitIDs
    ) = _decodeScavengeRewardsEvent(eventLog.data);

    // Assertions
    assertEq(regID, scavbar1.id, "regID mismatch");
    assertEq(scavengeType, "TEST", "scavengeType mismatch");
    assertEq(holderID, alice.id, "holderID mismatch");
    assertEq(commitIDs.length, 1, "commitIDs length mismatch");
    assertTrue(commitIDs[0] != 0, "commitID should be non-zero for droptable");
  }

  /// @notice Test DROPTABLE_REVEAL event
  function testDroptableRevealEvent() public {
    // Setup: create scavbar with droptable, claim to create commit
    uint32[] memory keys = new uint32[](2);
    keys[0] = 10;
    keys[1] = 20;
    uint256[] memory weights = new uint256[](2);
    weights[0] = 80;
    weights[1] = 20;

    _addReward(scavbar1.id, keys, weights, 1); // 1 roll per tier
    _incFor(alice, scavbar1, 2 * scavbar1.tierCost); // 2 tiers

    // Claim to create commits
    vm.recordLogs();
    _claim(alice, scavbar1.id);
    (, , , , , uint256[] memory commitIDs) = _decodeScavengeRewardsEvent(
      _findWorldEvent(vm.getRecordedLogs(), "SCAVENGE_REWARDS").data
    );

    // Advance block and reveal
    vm.roll(block.number + 2);
    vm.recordLogs();
    vm.prank(alice.operator);
    _DroptableRevealSystem.executeTyped(commitIDs);

    // Decode DROPTABLE_REVEAL event
    (
      uint256 commitID,
      uint256 holderID,
      uint256 dtID,
      ,
      ,
      uint256[] memory itemAmounts
    ) = _decodeDroptableRevealEvent(_findWorldEvent(vm.getRecordedLogs(), "DROPTABLE_REVEAL").data);

    // Assertions
    assertEq(commitID, commitIDs[0], "commitID mismatch");
    assertEq(holderID, alice.id, "holderID mismatch");
    assertTrue(dtID != 0, "dtID should be non-zero");

    // Verify total items distributed equals rolls * tiers (1 * 2 = 2)
    uint256 totalItems;
    for (uint i = 0; i < itemAmounts.length; i++) totalItems += itemAmounts[i];
    assertEq(totalItems, 2, "total items distributed mismatch");
  }

  /// @notice Test full event flow: SCAVENGE_REWARDS → DROPTABLE_REVEAL
  function testFullEventFlow() public {
    // Add basic item reward (index 100, value 10)
    _addReward(scavbar1.id, "ITEM", 100, 10);

    // Add droptable reward (2 rolls per tier)
    uint32[] memory keys = new uint32[](3);
    keys[0] = 1;
    keys[1] = 2;
    keys[2] = 3;
    uint256[] memory weights = new uint256[](3);
    weights[0] = 60;
    weights[1] = 30;
    weights[2] = 10;
    _addReward(scavbar1.id, keys, weights, 2);

    _incFor(alice, scavbar1, 3 * scavbar1.tierCost); // 3 tiers

    // Step 1: Claim
    vm.recordLogs();
    _claim(alice, scavbar1.id);
    (, , , , , uint256[] memory commitIDs) = _decodeScavengeRewardsEvent(
      _findWorldEvent(vm.getRecordedLogs(), "SCAVENGE_REWARDS").data
    );

    // commitIDs should have entry for each allo (basic item = 0, droptable = non-zero)
    assertEq(commitIDs.length, 2, "should have 2 commitIDs");
    assertEq(commitIDs[0], 0, "basic item should have no commitID");
    assertTrue(commitIDs[1] != 0, "droptable should have commitID");

    // Verify basic item was distributed immediately (10 * 3 tiers = 30)
    assertEq(_getItemBal(alice, 100), 30, "basic item not distributed");

    // Step 2: Reveal
    vm.roll(block.number + 2);
    uint256[] memory revealsArray = new uint256[](1);
    revealsArray[0] = commitIDs[1];

    vm.recordLogs();
    vm.prank(alice.operator);
    _DroptableRevealSystem.executeTyped(revealsArray);

    (uint256 commitID, , , , , uint256[] memory itemAmounts) = _decodeDroptableRevealEvent(
      _findWorldEvent(vm.getRecordedLogs(), "DROPTABLE_REVEAL").data
    );

    // Verify commitID matches and droptable items were distributed (2 rolls * 3 tiers = 6)
    assertEq(commitID, commitIDs[1], "commitID should match between events");
    uint256 totalDropItems;
    for (uint i = 0; i < itemAmounts.length; i++) totalDropItems += itemAmounts[i];
    assertEq(totalDropItems, 6, "droptable items total mismatch");
  }

  /////////////////
  // CHUNKED REVEAL

  // single-item droptable so every roll yields item 1: bal(1) == rolls revealed
  function _addSingleItemDT(uint256 rollsPerTier) internal {
    uint32[] memory keys = new uint32[](1);
    keys[0] = 1;
    uint256[] memory weights = new uint256[](1);
    weights[0] = 1;
    _addReward(scavbar1.id, keys, weights, rollsPerTier);
  }

  function _claimGetDTCommit(
    PlayerAccount memory acc,
    uint256 scavBarID
  ) internal returns (uint256) {
    vm.recordLogs();
    _claim(acc, scavBarID);
    (, , , , , uint256[] memory commitIDs) = _decodeScavengeRewardsEvent(
      _findWorldEvent(vm.getRecordedLogs(), "SCAVENGE_REWARDS").data
    );
    for (uint256 i; i < commitIDs.length; i++) if (commitIDs[i] != 0) return commitIDs[i];
    revert("no DT commit created");
  }

  function _revealOnce(PlayerAccount memory acc, uint256 commitID) internal {
    uint256[] memory ids = new uint256[](1);
    ids[0] = commitID;
    vm.prank(acc.operator);
    _DroptableRevealSystem.executeTyped(ids);
  }

  /// @notice a commit larger than MAX drains over multiple reveals, total exact
  function testChunkedDrainFatCommit() public {
    _addSingleItemDT(1);
    uint256 rolls = 12_000; // > MAX_ROLLS_PER_REVEAL
    _incFor(alice, scavbar1, rolls * scavbar1.tierCost);
    uint256 commitID = _claimGetDTCommit(alice, scavbar1.id);
    assertEq(_ValueComponent.get(commitID), rolls, "initial commit rolls");

    vm.roll(block.number + 2);

    // first reveal caps at MAX and carries the remainder
    _revealOnce(alice, commitID);
    assertEq(_getItemBal(alice, 1), 5000, "first chunk distributes exactly MAX");
    assertEq(_ValueComponent.get(commitID), rolls - 5000, "remainder carried");
    assertTrue(_BlockRevealComponent.has(commitID), "commit alive mid-drain");

    // drain the rest
    uint256 guard;
    while (_BlockRevealComponent.has(commitID)) {
      _revealOnce(alice, commitID);
      require(++guard < 10, "drain did not converge");
    }

    assertEq(_getItemBal(alice, 1), rolls, "all rolls distributed after drain");
    assertFalse(_BlockRevealComponent.has(commitID), "commit deleted after drain");
  }

  /// @notice a commit exactly at MAX drains in a single pass (legacy behavior)
  function testRevealAtMaxSinglePass() public {
    _addSingleItemDT(1);
    uint256 rolls = 5000; // == MAX
    _incFor(alice, scavbar1, rolls * scavbar1.tierCost);
    uint256 commitID = _claimGetDTCommit(alice, scavbar1.id);

    vm.roll(block.number + 2);
    _revealOnce(alice, commitID);

    assertEq(_getItemBal(alice, 1), rolls, "all distributed in one pass");
    assertFalse(_BlockRevealComponent.has(commitID), "commit consumed in one pass");
  }

  /// @notice the per-tx budget is shared across all commits in one reveal call
  function testPerTxBudgetAcrossCommits() public {
    _addSingleItemDT(1);

    _incFor(alice, scavbar1, 4000 * scavbar1.tierCost);
    uint256 c1 = _claimGetDTCommit(alice, scavbar1.id);
    _incFor(alice, scavbar1, 4000 * scavbar1.tierCost);
    uint256 c2 = _claimGetDTCommit(alice, scavbar1.id);

    vm.roll(block.number + 2);
    uint256[] memory ids = new uint256[](2);
    ids[0] = c1;
    ids[1] = c2;
    vm.prank(alice.operator);
    _DroptableRevealSystem.executeTyped(ids);

    // budget 5000: the dedup guard sorts the batch ascending by ID, so the
    // lower commit ID drains fully (4000) and the other gets the remaining 1000
    uint256 first = c1 < c2 ? c1 : c2;
    uint256 second = c1 < c2 ? c2 : c1;
    assertEq(_getItemBal(alice, 1), 5000, "per-tx budget caps total across commits");
    assertFalse(_BlockRevealComponent.has(first), "lower-id commit fully drained");
    assertTrue(_BlockRevealComponent.has(second), "higher-id commit partially drained");
    assertEq(_ValueComponent.get(second), 3000, "higher-id commit remainder");
  }

  /// @notice a duplicated commit ID in a reveal batch reverts outright
  function testRevealDuplicateCommitReverts() public {
    _addSingleItemDT(1);
    _incFor(alice, scavbar1, 100 * scavbar1.tierCost);
    uint256 commitID = _claimGetDTCommit(alice, scavbar1.id);

    vm.roll(block.number + 2);
    uint256[] memory ids = new uint256[](2);
    ids[0] = commitID;
    ids[1] = commitID;
    vm.prank(alice.operator);
    vm.expectRevert("LibArray: detected duplicate in array");
    _DroptableRevealSystem.executeTyped(ids);
  }

  /// @notice re-revealing a fully-drained commit is a no-op, not a revert
  function testRevealDrainedCommitIsGraceful() public {
    _addSingleItemDT(1);
    _incFor(alice, scavbar1, 100 * scavbar1.tierCost);
    uint256 commitID = _claimGetDTCommit(alice, scavbar1.id);

    vm.roll(block.number + 2);
    _revealOnce(alice, commitID); // fully drains (100 < MAX)
    assertEq(_getItemBal(alice, 1), 100, "distributed");
    assertFalse(_BlockRevealComponent.has(commitID), "consumed");

    // revealing again must not revert or double-distribute
    _revealOnce(alice, commitID);
    assertEq(_getItemBal(alice, 1), 100, "no double distribution");
  }

  /// @notice draining a commit yields the same items no matter how it is batched.
  ///         a co-bundled commit shifts the fat commit's chunk boundaries; the
  ///         per-roll global index makes the outcome invariant, so a player cannot
  ///         cherry-pick a favorable batching. would fail under a per-chunk nonce.
  function testChunkedRevealIsBatchInvariant() public {
    // fat commit on a 3-item droptable so the distribution is observable
    uint32[] memory keysF = new uint32[](3);
    keysF[0] = 1;
    keysF[1] = 2;
    keysF[2] = 3;
    uint256[] memory wF = new uint256[](3);
    wF[0] = 3;
    wF[1] = 2;
    wF[2] = 1;
    _addReward(scavbar1.id, keysF, wF, 12); // 12 rolls/tier
    _incFor(alice, scavbar1, 500 * scavbar1.tierCost); // 500 tiers -> 6000 rolls
    uint256 fat = _claimGetDTCommit(alice, scavbar1.id);
    assertEq(_ValueComponent.get(fat), 6000, "fat rolls");

    // sibling commit on a disjoint droptable (item 100) that eats budget ahead of fat
    ScavBarData memory bar2 = _createScavBar("TEST", 2, "NORMAL", 5);
    uint32[] memory keysS = new uint32[](1);
    keysS[0] = 100;
    uint256[] memory wS = new uint256[](1);
    wS[0] = 1;
    _addReward(bar2.id, keysS, wS, 1);
    _incFor(alice, bar2, 500 * bar2.tierCost); // 500 rolls
    uint256 sibling = _claimGetDTCommit(alice, bar2.id);
    assertEq(_ValueComponent.get(sibling), 500, "sibling rolls");

    vm.roll(block.number + 2);

    // strategy 1: fat alone -> chunks [5000, 1000]
    uint256 snap = vm.snapshotState();
    _drain(alice, _one(fat));
    uint256 a1 = _getItemBal(alice, 1);
    uint256 a2 = _getItemBal(alice, 2);
    uint256 a3 = _getItemBal(alice, 3);
    assertEq(a1 + a2 + a3, 6000, "all fat rolls distributed (alone)");
    assertTrue(a1 > 0 && a2 > 0 && a3 > 0, "multi-item spread (non-vacuous)");

    // strategy 2: [sibling, fat] -> sibling eats 500, fat chunks shift to [4500, 1500]
    vm.revertToState(snap);
    uint256[] memory bundled = new uint256[](2);
    bundled[0] = sibling;
    bundled[1] = fat;
    _drain(alice, bundled);
    // items 1/2/3 come only from the fat commit; item 100 only from the sibling
    assertEq(_getItemBal(alice, 1), a1, "item1 invariant to batch composition");
    assertEq(_getItemBal(alice, 2), a2, "item2 invariant to batch composition");
    assertEq(_getItemBal(alice, 3), a3, "item3 invariant to batch composition");
    assertEq(_getItemBal(alice, 100), 500, "sibling fully drained");
  }

  function _one(uint256 id) internal pure returns (uint256[] memory ids) {
    ids = new uint256[](1);
    ids[0] = id;
  }

  function _anyAlive(uint256[] memory ids) internal view returns (bool) {
    for (uint256 i; i < ids.length; i++) if (_BlockRevealComponent.has(ids[i])) return true;
    return false;
  }

  function _drain(PlayerAccount memory acc, uint256[] memory ids) internal {
    uint256 guard;
    while (_anyAlive(ids)) {
      vm.prank(acc.operator);
      _DroptableRevealSystem.executeTyped(ids);
      require(++guard < 20, "drain did not converge");
    }
  }

  /// @notice a commit of a non-droptable type is rejected (checkIsCommit)
  function testRevealNonDroptableCommitReverts() public {
    vm.startPrank(deployer);
    uint256 fakeCommit = LibCommit.commit(world, components, alice.id, block.number, "SOME_OTHER_COMMIT");
    vm.stopPrank();

    vm.roll(block.number + 2);
    uint256[] memory ids = new uint256[](1);
    ids[0] = fakeCommit;
    vm.prank(alice.operator);
    vm.expectRevert("not reveal entity");
    _DroptableRevealSystem.executeTyped(ids);
  }
}
