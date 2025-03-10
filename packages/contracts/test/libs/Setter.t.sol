// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { VipScore } from "initia-vip/VipScore.sol";

contract LibSetterTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function setUpConfigs() public override {
    super.setUpConfigs();
    _setConfig("VIP_STAGE", [uint32(block.timestamp), 1 days, 0, 0, 0, 0, 0, 0]);
  }

  function testSetVIP() public {
    ExternalCaller.setterUpdate("VIP", 0, 1, alice.id);

    VipScore.ScoreResponse memory score = VipScore(LibVIP.getAddress(components)).getScores(
      1,
      0,
      10
    )[0];
    assertEq(score.amount, 1);
    assertEq(score.addr, alice.owner);
  }
}
