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
    _createReward(parentID1, "ITEM_DROPTABLE", keys, weights, 1);
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
    assertEq(_getItemBal(alice, 1) + _getItemBal(alice, 2) + _getItemBal(alice, 3), 1);
    assertEq(_getItemBal(bob, 1) + _getItemBal(bob, 2) + _getItemBal(bob, 3), 5);
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
    _createReward(parentID1, "ITEM_DROPTABLE", keys1, weights1, 1);
    uint32[] memory keys2 = new uint32[](1);
    keys2[0] = 4;
    uint256[] memory weights2 = new uint256[](1);
    weights2[0] = 9;
    _createReward(parentID1, "ITEM_DROPTABLE", keys2, weights2, 7);
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

  function testDistributionMixed() public {
    uint32[] memory keys = new uint32[](3);
    keys[0] = 1;
    keys[1] = 2;
    keys[2] = 3;
    uint256[] memory weights = new uint256[](3);
    weights[0] = 9;
    weights[1] = 9;
    weights[2] = 9;
    _createReward(parentID1, "ITEM_DROPTABLE", keys, weights, 1);
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
    uint32[] memory keys = new uint32[](0);
    uint256[] memory weights = new uint256[](0);
    vm.startPrank(deployer);
    id = LibReward.create(world, components, parentID, type_, index, keys, weights, value);
    vm.stopPrank();
  }

  // droptable reward
  function _createReward(
    uint256 parentID,
    string memory type_,
    uint32[] memory keys,
    uint256[] memory weights,
    uint256 value
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    id = LibReward.create(world, components, parentID, type_, 0, keys, weights, value);
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
    assertTrue(LibCommit.isAvailable(components, commitID));
  }
}
