// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { VipScore } from "utils/VipScore.sol";

contract VIPTest is SetupTemplate {
  uint256 epochDuration = 1 days;
  VipScore vipContract;

  function setUp() public override {
    super.setUp();

    vipContract = VipScore(LibVIP.getAddress(components));
  }

  function setUpConfigs() public override {
    super.setUpConfigs();
    _setConfig("VIP_STAGE", [uint32(block.timestamp), uint32(epochDuration), 0, 0, 0, 0, 0, 0]);
  }

  function testVIPSingleStage() public {
    vm.startPrank(deployer);

    LibVIP.inc(components, alice.id, 3);
    assertEq(1, LibVIP.getStage(components));
    (bool isIndexed, uint64 score) = vipContract.scores(1, alice.owner);
    assertEq(3, score);

    _fastForward(10 minutes);
    LibVIP.inc(components, alice.id, 7);
    (isIndexed, score) = vipContract.scores(1, alice.owner);
    assertEq(10, score);
    LibVIP.inc(components, bob.id, 3);
    (isIndexed, score) = vipContract.scores(1, bob.owner);
    assertEq(3, score);

    vm.stopPrank();
  }

  function testVIPMultiStage() public {
    vm.startPrank(deployer);

    // increasing in stage 1
    LibVIP.inc(components, alice.id, 3);

    // get to stage 2, increase and finalize
    _fastForward(epochDuration + 10);
    LibVIP.inc(components, alice.id, 7);
    assertEq(2, LibVIP.getStage(components));
    (uint64 stage, uint64 totalScore, bool isFinalized) = vipContract.stages(1);
    assertEq(3, totalScore); // stage 1 score
    assertTrue(isFinalized); // stage 1 finalized
    (stage, totalScore, isFinalized) = vipContract.stages(2);
    assertEq(7, totalScore); // stage 2 score
    assertFalse(isFinalized); // stage 2 not finalized
    // checking individual scores
    (bool isIndexed, uint64 score) = vipContract.scores(1, alice.owner);
    assertEq(3, score);
    (isIndexed, score) = vipContract.scores(2, alice.owner);
    assertEq(7, score);

    // increase in stage 2 again
    LibVIP.inc(components, bob.id, 3);
    (stage, totalScore, isFinalized) = vipContract.stages(1);
    assertEq(3, totalScore); // stage 1 score
    assertTrue(isFinalized); // stage 1 finalized
    (stage, totalScore, isFinalized) = vipContract.stages(2);
    assertEq(10, totalScore); // stage 2 score
    assertFalse(isFinalized); // stage 2 not finalized
    // checking individual scores
    (isIndexed, score) = vipContract.scores(1, alice.owner);
    assertEq(3, score);
    (isIndexed, score) = vipContract.scores(2, alice.owner);
    assertEq(7, score);
    (isIndexed, score) = vipContract.scores(1, bob.owner);
    assertEq(0, score);
    (isIndexed, score) = vipContract.scores(2, bob.owner);
    assertEq(3, score);

    // get to stage 3, increase and finalize
    _fastForward(epochDuration + 10);
    LibVIP.inc(components, alice.id, 11);
    assertEq(3, LibVIP.getStage(components));
    (stage, totalScore, isFinalized) = vipContract.stages(1);
    assertEq(3, totalScore); // stage 1 score
    assertTrue(isFinalized); // stage 1 finalized
    (stage, totalScore, isFinalized) = vipContract.stages(2);
    assertEq(10, totalScore); // stage 2 score
    assertTrue(isFinalized); // stage 2 finalized
    (stage, totalScore, isFinalized) = vipContract.stages(3);
    assertEq(11, totalScore); // stage 3 score
    assertFalse(isFinalized); // stage 3 not finalized

    // increase in stage 3 again
    LibVIP.inc(components, bob.id, 5);
    LibVIP.inc(components, alice.id, 3);
    (stage, totalScore, isFinalized) = vipContract.stages(3);
    assertEq(19, totalScore); // stage 3 score
    assertFalse(isFinalized); // stage 3 not finalized
    // testing individual scores
    (isIndexed, score) = vipContract.scores(1, alice.owner);
    assertEq(3, score);
    (isIndexed, score) = vipContract.scores(2, alice.owner);
    assertEq(7, score);
    (isIndexed, score) = vipContract.scores(3, alice.owner);
    assertEq(14, score);
    (isIndexed, score) = vipContract.scores(1, bob.owner);
    assertEq(0, score);
    (isIndexed, score) = vipContract.scores(2, bob.owner);
    assertEq(3, score);
    (isIndexed, score) = vipContract.scores(3, bob.owner);
    assertEq(5, score);

    vm.stopPrank();
  }
}
