// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

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
    uint256 scavBarID = __NodeRegistrySystem.addScavBar(nodeIndex, scavCost);

    // setup kami on node
    uint256 kamiID = _mintKami(alice);
    uint256 harvestID = _startHarvestByIndex(kamiID, nodeIndex);
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
    id = LibAllo.createBasic(components, anchorID, type_, rwdIndex, value);
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
    id = LibAllo.createDT(components, anchorID, keys, weights, value);
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
}
