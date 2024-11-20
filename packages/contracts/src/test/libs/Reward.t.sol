// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

contract RewardTest is SetupTemplate {
  uint256 constant parentID1 = uint256(keccak256(abi.encodePacked("parent")));

  function setUp() public override {
    super.setUp();

    vm.roll(++_currBlock);
  }

  function setUpItems() public override {
    _createGenericItem(1);
    _createGenericItem(2);
    _createGenericItem(3);
    _createGenericItem(4);
  }

  function testRewardShapeBasic() public {
    uint256 rewardID = _createReward(parentID1, "ITEM", 1, 1);
    assertEq(LibReward.genID(parentID1, "ITEM", 1), rewardID);
    uint256 rewardID2 = _createReward(parentID1, "ITEM", 2, 2);
    assertEq(LibReward.genID(parentID1, "ITEM", 2), rewardID2);

    // test remove individual (expected to be removed all at once)
    vm.startPrank(deployer);
    LibReward.remove(components, rewardID);
    vm.stopPrank();

    // test update
    uint256 newRewardID = _createReward(parentID1, "ITEM", 1, 2);
    assertEq(newRewardID, rewardID);
    assertEq(_ValueComponent.get(rewardID), 2);
  }

  function testRewardShapeDT() public {
    uint32[] memory keys = new uint32[](1);
    keys[0] = 1;
    uint256[] memory weights = new uint256[](1);
    weights[0] = 1;
    uint256 rewardID = _createReward(parentID1, keys, weights, 1);
    assertEq(LibReward.genID(parentID1, "ITEM_DROPTABLE", 1), rewardID);
    uint256 rewardID2 = _createReward(parentID1, keys, weights, 2);
    assertEq(LibReward.genID(parentID1, "ITEM_DROPTABLE", 2), rewardID2);
    uint256 rewardID3 = _createReward(parentID1, keys, weights, 3);
    assertEq(LibReward.genID(parentID1, "ITEM_DROPTABLE", 3), rewardID3);

    // no test remove individually - expected to remove all at once
  }

  function testRewardShapeStat() public {
    uint256 healthID = _createRewardStat(parentID1, "HEALTH", Stat(1, 0, 0, 0));
    uint256 harmonyID = _createRewardStat(parentID1, "HARMONY", Stat(1, 0, 0, 0));
    uint256 powerID = _createRewardStat(parentID1, "POWER", Stat(1, 0, 0, 0));
    uint256 slotsID = _createRewardStat(parentID1, "SLOTS", Stat(1, 0, 0, 0));
    uint256 staminaID = _createRewardStat(parentID1, "STAMINA", Stat(1, 0, 0, 0));
    uint256 violenceID = _createRewardStat(parentID1, "VIOLENCE", Stat(1, 0, 0, 0));

    // test remove individual (expected to remove all at once)
    vm.startPrank(deployer);
    LibReward.remove(components, healthID);
    vm.stopPrank();

    // test update
    uint256 newHealthID = _createRewardStat(parentID1, "HEALTH", Stat(2, 0, 0, 0));
    assertEq(newHealthID, healthID);
  }

  function testDistributionBasicSingle() public {
    _createReward(parentID1, "ITEM", 1, 1);

    // without multiplier
    _distribute(parentID1, alice);
    assertEq(_getItemBal(alice, 1), 1);

    // with multiplier
    _distribute(parentID1, 2, bob);
    assertEq(_getItemBal(bob, 1), 2);
  }

  function testDistributionBasicMultiple() public {
    _createReward(parentID1, "ITEM", 1, 1);
    _createReward(parentID1, "ITEM", 2, 2);
    _createReward(parentID1, "ITEM", 3, 3);

    // without multiplier
    _distribute(parentID1, alice);
    assertEq(_getItemBal(alice, 1), 1);
    assertEq(_getItemBal(alice, 2), 2);
    assertEq(_getItemBal(alice, 3), 3);

    // with multiplier
    _distribute(parentID1, 5, bob);
    assertEq(_getItemBal(bob, 1), 5);
    assertEq(_getItemBal(bob, 2), 10);
    assertEq(_getItemBal(bob, 3), 15);
  }

  function testDistributionDTSingle() public {
    uint32[] memory keys = new uint32[](3);
    keys[0] = 1;
    keys[1] = 2;
    keys[2] = 3;
    uint256[] memory weights = new uint256[](3);
    weights[0] = 9;
    weights[1] = 9;
    weights[2] = 9;
    _createReward(parentID1, keys, weights, 1);
    uint256[] memory commitIDs = new uint256[](2);

    // without multiplier
    // need to simulate commitID - no way to get it via pure contract
    commitIDs[0] = simGetUniqueEntityId();
    _distribute(parentID1, alice);
    _asssertCommit(commitIDs[0]);

    // with multiplier
    commitIDs[1] = simGetUniqueEntityId();
    _distribute(parentID1, 5, bob);
    _asssertCommit(commitIDs[1]);

    // revealing both
    vm.roll(++_currBlock);
    _DroptableRevealSystem.executeTyped(commitIDs);

    // check balances
    assertEq(
      _getItemBal(alice, 1) + _getItemBal(alice, 2) + _getItemBal(alice, 3),
      1,
      "alice wrong item balance"
    );
    assertEq(
      _getItemBal(bob, 1) + _getItemBal(bob, 2) + _getItemBal(bob, 3),
      5,
      "bob wrong item balance"
    );
  }

  function testDistributionDTMultiple() public {
    uint32[] memory keys1 = new uint32[](3);
    keys1[0] = 1;
    keys1[1] = 2;
    keys1[2] = 3;
    uint256[] memory weights1 = new uint256[](3);
    weights1[0] = 9;
    weights1[1] = 9;
    weights1[2] = 9;
    _createReward(parentID1, keys1, weights1, 1);
    uint32[] memory keys2 = new uint32[](1);
    keys2[0] = 4;
    uint256[] memory weights2 = new uint256[](1);
    weights2[0] = 9;
    _createReward(parentID1, keys2, weights2, 7);
    uint256[] memory commitIDs = new uint256[](4);

    // without multiplier
    // need to simulate commitID - no way to get it via pure contract
    commitIDs[0] = simGetUniqueEntityId();
    commitIDs[1] = simGetUniqueEntityId(getWorldNonce() + 2);
    _distribute(parentID1, alice);
    _asssertCommit(commitIDs[0]);
    _asssertCommit(commitIDs[1]);

    // with multiplier
    commitIDs[2] = simGetUniqueEntityId();
    commitIDs[3] = simGetUniqueEntityId(getWorldNonce() + 2);
    _distribute(parentID1, 5, bob);
    _asssertCommit(commitIDs[2]);
    _asssertCommit(commitIDs[3]);

    // revealing all
    vm.roll(++_currBlock);
    _DroptableRevealSystem.executeTyped(commitIDs);

    // check balances
    assertEq(_getItemBal(alice, 1) + _getItemBal(alice, 2) + _getItemBal(alice, 3), 1);
    assertEq(_getItemBal(alice, 4), 7);
    assertEq(_getItemBal(bob, 1) + _getItemBal(bob, 2) + _getItemBal(bob, 3), 5);
    assertEq(_getItemBal(bob, 4), 35);
  }

  function testDistributionStat() public {
    uint256 healthID = _createRewardStat(parentID1, "HEALTH", Stat(0, 1, 0, 100));
    uint256 harmonyID = _createRewardStat(parentID1, "HARMONY", Stat(0, 1, 0, 0));
    uint256 powerID = _createRewardStat(parentID1, "POWER", Stat(0, -1, 0, 0));

    // setting initial stats
    vm.startPrank(deployer);
    LibStat.setHealth(components, alice.id, Stat(100, 0, 0, 50));
    LibStat.setHarmony(components, alice.id, Stat(10, 0, 0, 10));
    LibStat.setPower(components, alice.id, Stat(10, 0, 0, 10));
    vm.stopPrank();

    // distribute
    _distribute(parentID1, alice);

    // checking result
    assertEq(LibStat.get(components, "HEALTH", alice.id), Stat(100, 1, 0, 101));
    assertEq(LibStat.get(components, "HARMONY", alice.id), Stat(10, 1, 0, 10));
    assertEq(LibStat.get(components, "POWER", alice.id), Stat(10, -1, 0, 10));

    // distribute multiple
    _distribute(parentID1, 5, alice);

    // checking result
    assertEq(LibStat.get(components, "HEALTH", alice.id), Stat(100, 6, 0, 106));
    assertEq(LibStat.get(components, "HARMONY", alice.id), Stat(10, 6, 0, 10));
    assertEq(LibStat.get(components, "POWER", alice.id), Stat(10, -6, 0, 10));
  }

  function testDistributionMixed() public {
    uint32[] memory keys = new uint32[](3);
    keys[0] = 1;
    keys[1] = 2;
    keys[2] = 3;
    uint256[] memory weights = new uint256[](3);
    weights[0] = 9;
    weights[1] = 9;
    weights[2] = 9;
    _createReward(parentID1, keys, weights, 1);
    _createReward(parentID1, "ITEM", 4, 5);

    // initial distribution (no multiplier)
    uint256[] memory commitIDs = new uint256[](1);
    commitIDs[0] = simGetUniqueEntityId();
    _distribute(parentID1, alice);
    assertEq(_getItemBal(alice, 1) + _getItemBal(alice, 2) + _getItemBal(alice, 3), 0);
    assertEq(_getItemBal(alice, 4), 5);

    // reveal
    vm.roll(++_currBlock);
    _DroptableRevealSystem.executeTyped(commitIDs);
    assertEq(_getItemBal(alice, 1) + _getItemBal(alice, 2) + _getItemBal(alice, 3), 1);
  }

  //////////////
  // UTILS

  // basic reward
  function _createReward(
    uint256 parentID,
    string memory type_,
    uint32 index,
    uint256 value
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    id = LibReward.createBasic(components, parentID, type_, index, value);
    vm.stopPrank();
  }

  // droptable reward
  function _createReward(
    uint256 parentID,
    uint32[] memory keys,
    uint256[] memory weights,
    uint256 value
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    id = LibReward.createDT(components, parentID, keys, weights, value);
    vm.stopPrank();
  }

  function _createRewardStat(
    uint256 parentID,
    string memory statType,
    Stat memory value
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    id = LibReward.createStat(
      components,
      parentID,
      statType,
      value.base,
      value.shift,
      value.boost,
      value.sync
    );
    vm.stopPrank();
  }

  function _distribute(uint256 parentID, uint256 multiplier, PlayerAccount memory acc) internal {
    uint256[] memory rewardIDs = LibReward.queryFor(components, parentID);
    vm.startPrank(deployer);
    LibReward.distribute(world, components, rewardIDs, multiplier, acc.id);
    vm.stopPrank();
  }

  function _distribute(uint256 parentID, PlayerAccount memory acc) internal {
    uint256[] memory rewardIDs = LibReward.queryFor(components, parentID);
    vm.startPrank(deployer);
    LibReward.distribute(world, components, rewardIDs, acc.id);
    vm.stopPrank();
  }

  /////////////////
  // ASSERTIONS

  function _asssertCommit(uint256 commitID) internal {
    assertTrue(_BlockRevealComponent.has(commitID), "commit not available");
  }
}
