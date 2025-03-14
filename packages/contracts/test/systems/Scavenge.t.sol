// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

struct ScavBarData {
  uint256 id; // registry id
  string field;
  uint32 index;
  uint256 tierCost;
}

contract ScavengeTest is SetupTemplate {
  ScavBarData public scavbar1;

  function setUp() public override {
    super.setUp();

    // create basic empty scavbar
    scavbar1 = _createScavBar("test", 1, 5);
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
    vm.prank(alice.operator);
    _ScavengeClaimSystem.executeTyped(scavbar1.id);

    assertEq(_getItemBal(alice, 1), amt, "item balance mismatch");
    _assertPoints(alice, scavbar1, 3);
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
      scavBar.field,
      scavBar.index,
      acc.id
    );
    vm.stopPrank();
    return numTiers;
  }

  function _createScavBar(
    string memory field,
    uint32 index,
    uint256 tierCost
  ) internal returns (ScavBarData memory) {
    vm.startPrank(deployer);
    uint256 id = LibScavenge.create(components, field, index, tierCost);
    vm.stopPrank();
    return ScavBarData(id, field, index, tierCost);
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
    string memory type_,
    uint32[] memory keys,
    uint256[] memory weights,
    uint256 value
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    uint256 anchorID = LibScavenge.genAlloAnchor(scavBarID);
    id = LibAllo.createDT(components, anchorID, keys, weights, value);
    vm.stopPrank();
  }

  /////////////////
  // ASSERTIONS

  function _assertPoints(
    PlayerAccount memory acc,
    ScavBarData memory scavBar,
    uint256 amt
  ) internal {
    uint256 instanceID = LibScavenge.genInstanceID(scavBar.field, scavBar.index, acc.id);
    uint256 curr = _ValueComponent.get(instanceID);
    assertEq(curr, amt, "scav points mismatch");
  }
}
