// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { VipScore } from "utils/VipScore.sol";

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

  function testSetCooldown() public {
    uint256 kamiID = _mintKami(alice);
    _fastForward(_idleRequirement);

    // starting harvest, set cooldown
    uint256 ogEndTime = _idleRequirement + block.timestamp - 1;
    _startHarvest(kamiID, 1);
    assertEq(uint256(LibCooldown.getEnd(components, kamiID)), ogEndTime);

    // adding cooldown
    ExternalCaller.setterUpdate("COOLDOWN", 0, 555, kamiID);
    assertEq(uint256(LibCooldown.getEnd(components, kamiID)), 555 + ogEndTime);
  }
}
