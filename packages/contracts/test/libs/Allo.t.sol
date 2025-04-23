// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract AlloTest is SetupTemplate {
  uint256 constant anchorID1 = uint256(keccak256(abi.encodePacked("parent")));

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

  function testAlloShapeBasic() public {
    uint256 rewardID = _createAllo(anchorID1, "ITEM", 1, 1);
    assertEq(LibAllo.genID(anchorID1, "ITEM", 1), rewardID);
    uint256 rewardID2 = _createAllo(anchorID1, "ITEM", 2, 2);
    assertEq(LibAllo.genID(anchorID1, "ITEM", 2), rewardID2);

    // test remove individual (expected to be removed all at once)
    vm.startPrank(deployer);
    LibAllo.remove(components, rewardID);
    vm.stopPrank();

    // test update
    uint256 newRewardID = _createAllo(anchorID1, "ITEM", 1, 2);
    assertEq(newRewardID, rewardID);
    assertEq(_ValueComponent.get(rewardID), 2);
  }

  function testAlloShapeBonus() public {
    uint256 bonusID = _createAlloBonus(
      anchorID1,
      "STAT_HEALTH_SHIFT",
      "UPON_HARVEST_OR_FEED",
      0,
      10
    );
    uint256 bonusID1 = _createAlloBonus(
      anchorID1,
      "STAT_POWER_SHIFT",
      "UPON_HARVEST_OR_FEED",
      0,
      5
    );

    // assert shape - only 1 bonus allo entity
    assertEq(bonusID, bonusID1, "allo bonusID mismatch");
    assertEq(LibAllo.queryFor(components, anchorID1).length, 1, "allo bonus count mismatch");

    // removal
    vm.startPrank(deployer);
    LibAllo.remove(components, bonusID);
    vm.stopPrank();
    assertEq(LibAllo.queryFor(components, anchorID1).length, 0, "removed bonus count mismatch");
  }

  function testAlloShapeDT() public {
    uint32[] memory keys = new uint32[](1);
    keys[0] = 1;
    uint256[] memory weights = new uint256[](1);
    weights[0] = 1;
    uint256 rewardID = _createAllo(anchorID1, keys, weights, 1);
    assertEq(LibAllo.genID(anchorID1, "ITEM_DROPTABLE", 1), rewardID);
    uint256 rewardID2 = _createAllo(anchorID1, keys, weights, 2);
    assertEq(LibAllo.genID(anchorID1, "ITEM_DROPTABLE", 2), rewardID2);
    uint256 rewardID3 = _createAllo(anchorID1, keys, weights, 3);
    assertEq(LibAllo.genID(anchorID1, "ITEM_DROPTABLE", 3), rewardID3);

    // no test remove individually - expected to remove all at once
  }

  function testAlloShapeStat() public {
    uint256 healthID = _createAlloStat(anchorID1, "HEALTH", Stat(1, 0, 0, 0));
    uint256 harmonyID = _createAlloStat(anchorID1, "HARMONY", Stat(1, 0, 0, 0));
    uint256 powerID = _createAlloStat(anchorID1, "POWER", Stat(1, 0, 0, 0));
    uint256 slotsID = _createAlloStat(anchorID1, "SLOTS", Stat(1, 0, 0, 0));
    uint256 staminaID = _createAlloStat(anchorID1, "STAMINA", Stat(1, 0, 0, 0));
    uint256 violenceID = _createAlloStat(anchorID1, "VIOLENCE", Stat(1, 0, 0, 0));

    // test remove individual (expected to remove all at once)
    vm.startPrank(deployer);
    LibAllo.remove(components, healthID);
    vm.stopPrank();

    // test update
    uint256 newHealthID = _createAlloStat(anchorID1, "HEALTH", Stat(2, 0, 0, 0));
    assertEq(newHealthID, healthID);
  }

  function testAlloDistributionBasicSingle() public {
    _createAllo(anchorID1, "ITEM", 1, 1);

    // without multiplier
    _distribute(anchorID1, alice);
    assertEq(_getItemBal(alice, 1), 1);

    // with multiplier
    _distribute(anchorID1, 2, bob);
    assertEq(_getItemBal(bob, 1), 2);
  }

  function testAlloDistributionBasicMultiple() public {
    _createAllo(anchorID1, "ITEM", 1, 1);
    _createAllo(anchorID1, "ITEM", 2, 2);
    _createAllo(anchorID1, "ITEM", 3, 3);

    // without multiplier
    _distribute(anchorID1, alice);
    assertEq(_getItemBal(alice, 1), 1);
    assertEq(_getItemBal(alice, 2), 2);
    assertEq(_getItemBal(alice, 3), 3);

    // with multiplier
    _distribute(anchorID1, 5, bob);
    assertEq(_getItemBal(bob, 1), 5);
    assertEq(_getItemBal(bob, 2), 10);
    assertEq(_getItemBal(bob, 3), 15);
  }

  function testAlloDistributionBonus() public {
    uint256 bonusID = _createAlloBonus(
      anchorID1,
      "STAT_HEALTH_SHIFT",
      "UPON_HARVEST_OR_FEED",
      0,
      10
    );
    uint256 bonusID1 = _createAlloBonus(
      anchorID1,
      "STAT_POWER_SHIFT",
      "UPON_HARVEST_OR_FEED",
      0,
      5
    );
    uint256 petID = _mintKami(alice);
    int32 totalHealth = LibStat.getTotal(components, "HEALTH", petID);
    int32 totalPower = LibStat.getTotal(components, "POWER", petID);

    // giving allo to pet
    vm.startPrank(deployer);
    uint256[] memory alloIDs = LibAllo.queryFor(components, anchorID1);
    LibAllo.distribute(world, components, alloIDs, petID);
    vm.stopPrank();

    // checking pet stats
    assertEq(LibStat.getTotal(components, "HEALTH", petID), totalHealth + 10);
    assertEq(LibStat.getTotal(components, "POWER", petID), totalPower + 5);
  }

  function testAlloDistributionDTSingle() public {
    uint32[] memory keys = new uint32[](3);
    keys[0] = 1;
    keys[1] = 2;
    keys[2] = 3;
    uint256[] memory weights = new uint256[](3);
    weights[0] = 9;
    weights[1] = 9;
    weights[2] = 9;
    _createAllo(anchorID1, keys, weights, 1);
    uint256[] memory commitIDs = new uint256[](2);

    // without multiplier
    // need to simulate commitID - no way to get it via pure contract
    commitIDs[0] = simGetUniqueEntityId();
    _distribute(anchorID1, alice);
    _asssertCommit(commitIDs[0]);

    // with multiplier
    commitIDs[1] = simGetUniqueEntityId();
    _distribute(anchorID1, 5, bob);
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

  function testAlloDistributionDTMultiple() public {
    uint32[] memory keys1 = new uint32[](3);
    keys1[0] = 1;
    keys1[1] = 2;
    keys1[2] = 3;
    uint256[] memory weights1 = new uint256[](3);
    weights1[0] = 9;
    weights1[1] = 9;
    weights1[2] = 9;
    _createAllo(anchorID1, keys1, weights1, 1);
    uint32[] memory keys2 = new uint32[](1);
    keys2[0] = 4;
    uint256[] memory weights2 = new uint256[](1);
    weights2[0] = 9;
    _createAllo(anchorID1, keys2, weights2, 7);
    uint256[] memory commitIDs = new uint256[](4);

    // without multiplier
    // need to simulate commitID - no way to get it via pure contract
    commitIDs[0] = simGetUniqueEntityId();
    commitIDs[1] = simGetUniqueEntityId(getWorldNonce() + 2);
    _distribute(anchorID1, alice);
    _asssertCommit(commitIDs[0]);
    _asssertCommit(commitIDs[1]);

    // with multiplier
    commitIDs[2] = simGetUniqueEntityId();
    commitIDs[3] = simGetUniqueEntityId(getWorldNonce() + 2);
    _distribute(anchorID1, 5, bob);
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

  function testAlloDistributionStat() public {
    uint256 healthID = _createAlloStat(anchorID1, "HEALTH", Stat(0, 1, 0, 100));
    uint256 harmonyID = _createAlloStat(anchorID1, "HARMONY", Stat(0, 1, 0, 0));
    uint256 powerID = _createAlloStat(anchorID1, "POWER", Stat(0, -1, 0, 0));

    // setting initial stats
    vm.startPrank(deployer);
    LibStat.setHealth(components, alice.id, Stat(100, 0, 0, 50));
    LibStat.setHarmony(components, alice.id, Stat(10, 0, 0, 10));
    LibStat.setPower(components, alice.id, Stat(10, 0, 0, 10));
    vm.stopPrank();

    // distribute
    _distribute(anchorID1, alice);

    // checking result
    assertEq(LibStat.get(components, "HEALTH", alice.id), Stat(100, 1, 0, 101));
    assertEq(LibStat.get(components, "HARMONY", alice.id), Stat(10, 1, 0, 10));
    assertEq(LibStat.get(components, "POWER", alice.id), Stat(10, -1, 0, 10));

    // distribute multiple
    _distribute(anchorID1, 5, alice);

    // checking result
    assertEq(LibStat.get(components, "HEALTH", alice.id), Stat(100, 6, 0, 106));
    assertEq(LibStat.get(components, "HARMONY", alice.id), Stat(10, 6, 0, 10));
    assertEq(LibStat.get(components, "POWER", alice.id), Stat(10, -6, 0, 10));
  }

  function testAlloDistributionMixed() public {
    uint32[] memory keys = new uint32[](3);
    keys[0] = 1;
    keys[1] = 2;
    keys[2] = 3;
    uint256[] memory weights = new uint256[](3);
    weights[0] = 9;
    weights[1] = 9;
    weights[2] = 9;
    _createAllo(anchorID1, keys, weights, 1);
    _createAllo(anchorID1, "ITEM", 4, 5);

    // initial distribution (no multiplier)
    uint256[] memory commitIDs = new uint256[](1);
    commitIDs[0] = simGetUniqueEntityId();
    _distribute(anchorID1, alice);
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
  function _createAllo(
    uint256 anchorID,
    string memory type_,
    uint32 index,
    uint256 value
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    id = LibAllo.createBasic(components, anchorID, type_, index, value);
    vm.stopPrank();
  }

  // droptable reward
  function _createAllo(
    uint256 anchorID,
    uint32[] memory keys,
    uint256[] memory weights,
    uint256 value
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    id = LibAllo.createDT(components, anchorID, keys, weights, value);
    vm.stopPrank();
  }

  function _createAlloStat(
    uint256 anchorID,
    string memory statType,
    Stat memory value
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    id = LibAllo.createStat(
      components,
      anchorID,
      statType,
      value.base,
      value.shift,
      value.boost,
      value.sync
    );
    vm.stopPrank();
  }

  function _createAlloBonus(
    uint256 anchorID,
    string memory bonusType,
    string memory endType,
    uint256 duration,
    int256 value
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    id = LibAllo.createBonus(components, anchorID, bonusType, endType, duration, value);
    vm.stopPrank();
  }

  function _distribute(uint256 anchorID, uint256 multiplier, PlayerAccount memory acc) internal {
    uint256[] memory rewardIDs = LibAllo.queryFor(components, anchorID);
    ExternalCaller.alloDistribute(rewardIDs, multiplier, acc.id);
  }

  function _distribute(uint256 anchorID, PlayerAccount memory acc) internal {
    _distribute(anchorID, 1, acc);
  }

  /////////////////
  // ASSERTIONS

  function _asssertCommit(uint256 commitID) internal {
    assertTrue(_BlockRevealComponent.has(commitID), "commit not available");
  }
}
