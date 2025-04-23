// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract KamiStatsTest is SetupTemplate {
  using SafeCastLib for int32;
  using SafeCastLib for uint256;

  int32 baseHealth;
  int32 basePower;
  int32 baseViolence;
  int32 baseHarmony;

  function setUp() public override {
    super.setUp();

    baseHealth = LibConfig.get(components, "KAMI_BASE_HEALTH").toInt32();
    basePower = LibConfig.get(components, "KAMI_BASE_POWER").toInt32();
    baseViolence = LibConfig.get(components, "KAMI_BASE_VIOLENCE").toInt32();
    baseHarmony = LibConfig.get(components, "KAMI_BASE_HARMONY").toInt32();
  }

  function setUpTraits() public override {
    registerTrait(0, 0, 0, 0, 0, 0, 9, "", "BG Common", "BACKGROUND");
    registerTrait(0, 0, 0, 0, 0, 0, 9, "NORMAL", "Body Common", "BODY");
    registerTrait(0, 0, 0, 0, 0, 0, 9, "", "Color Common", "COLOR");
    registerTrait(0, 0, 0, 0, 0, 0, 9, "", "Face Common", "FACE");
    registerTrait(0, 0, 0, 0, 0, 0, 9, "NORMAL", "Hands Common", "HAND");
  }

  function testKamiStatTotal() public {
    uint256 petID = _mintKami(alice);

    // no bonus, expected total = base
    assertEq(LibStat.getTotal(components, "HEALTH", petID), baseHealth, "wrong base health");
    assertEq(LibStat.getTotal(components, "POWER", petID), basePower, "wrong base power");
    assertEq(LibStat.getTotal(components, "VIOLENCE", petID), baseViolence, "wrong base violence");
    assertEq(LibStat.getTotal(components, "HARMONY", petID), baseHarmony, "wrong base harmony");

    // creating skill health bonus
    uint32 skillIndex = 1;
    _createSkill(skillIndex, "KAMI", 0, 10);
    _createSkillBonus(skillIndex, "STAT_HEALTH_SHIFT", int32(10));
    _createSkillBonus(skillIndex, "STAT_POWER_SHIFT", int32(-2));

    // adding skill
    _upgradeSkill(alice, petID, skillIndex);

    // checking stats
    assertEq(LibStat.getTotal(components, "HEALTH", petID), baseHealth + 10, "wrong health bonus");
    assertEq(LibStat.getTotal(components, "POWER", petID), basePower - 2, "wrong power bonus");
  }

  function testKamiRecovery() public {
    uint256 petID = _mintKami(alice);

    // draining health and checking recovery
    _sync(petID);
    _addHealth(petID, int32(-30));
    assertEq(LibStat.getCurrent(components, "HEALTH", petID), baseHealth - 30, "wrong drain");
    _fastForward(1 days); // should be more than enough to max heal
    _sync(petID);
    assertEq(LibStat.getCurrent(components, "HEALTH", petID), baseHealth, "wrong heal");

    // creating skill health bonus
    uint32 skillIndex = 1;
    _createSkill(skillIndex, "KAMI", 0, 10);
    _createSkillBonus(skillIndex, "STAT_HEALTH_SHIFT", int32(10));

    // adding skill
    _upgradeSkill(alice, petID, skillIndex);
    _fastForward(1 days); // should be more than enough to max heal
    _sync(petID);
    assertEq(LibStat.getCurrent(components, "HEALTH", petID), baseHealth + 10, "wrong skill max");

    // draining health and checking recovery, post skill
    _addHealth(petID, int32(-30));
    assertEq(LibStat.getCurrent(components, "HEALTH", petID), baseHealth - 20, "wrong skill drain");
    _fastForward(1 days); // should be more than enough to max heal
    _sync(petID);
    assertEq(LibStat.getCurrent(components, "HEALTH", petID), baseHealth + 10, "wrong skill heal");
  }

  ////////////////
  // UTILS

  function _addHealth(uint256 kamiID, int32 amt) internal {
    vm.startPrank(deployer);
    LibKami.heal(components, kamiID, amt);
    vm.stopPrank();
  }

  function _sync(uint256 kamiID) internal {
    ExternalCaller.kamiSync(kamiID);
  }
}
