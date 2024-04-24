// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";
import { Stat } from "components/types/StatComponent.sol";

contract SkillTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  ////////////////
  // SKILLS

  function testSkillCreate() public {
    _createSkill(1, "ACCOUNT", "PASSIVE", 0, 1);
    _createSkillEffect(1, "TEST_TYPE", "TEST_SUBTYPE", 1);
    _createSkillRequirement(1, "TEST_TYPE", "CURR_MIN", 0, 1);

    vm.prank(deployer);
    __RegistryDeleteSkillSystem.executeTyped(1);
  }

  // test whether skill upgrades are properly gated by skill point availability
  function testSkillBasicAccount() public {
    _createSkill(1, "ACCOUNT", "PASSIVE", 0, 1);

    // select skill
    _upgradeSkill(alice.index, alice.id, 1);
    assertTrue(LibSkill.get(components, alice.id, 1) != 0);
  }

  // test whether skill upgrades are properly gated by skill point availability
  function testSkillPoints() public {
    _createSkill(1, "ACCOUNT", "PASSIVE", 1, 1);

    // select skill (fail - no points)
    vm.prank(_getOperator(0));
    vm.expectRevert("SkillUpgrade: unmet prerequisites");
    _SkillUpgradeSystem.executeTyped(alice.id, 1);

    // give points, accept
    _giveSkillPoint(alice.id, 1);
    _upgradeSkill(alice.index, alice.id, 1);

    // check if skills are added
    assertTrue(LibSkill.get(components, alice.id, 1) != 0);
    assertEq(LibSkill.getPoints(components, alice.id), 0);
  }

  // test whether skill upgrades are properly gated by skill cap
  function testSkillMax() public {
    _createSkill(1, "ACCOUNT", "PASSIVE", 0, 2);

    _upgradeSkill(alice.index, alice.id, 1);
    _upgradeSkill(alice.index, alice.id, 1);

    // accept x3 (expect fail)
    vm.prank(_getOperator(0));
    vm.expectRevert("SkillUpgrade: unmet prerequisites");
    _SkillUpgradeSystem.executeTyped(alice.id, 1);

    // check if skills are added
    assertTrue(LibSkill.get(components, alice.id, 1) != 0);
  }

  function testCreateTree() public {
    uint256 regID = _createSkill(1, "ACCOUNT", "PASSIVE", "TREE", 0, 5, 1);
    (bool has, string memory tree, uint256 tier) = LibRegistrySkill.getTree(components, regID);
    assertFalse(regID == 0);
    assertTrue(has);
    assertEq("TREE", tree);
    assertEq(1, tier);
  }

  function testSkillTree(uint32 tier) public {
    uint256 regID1 = _createSkill(1, "ACCOUNT", "PASSIVE", "TREE", 0, 5, 0);
    uint256 regID2 = _createSkill(2, "ACCOUNT", "PASSIVE", "TREE", 0, 5, 1);
    uint256 regID3 = _createSkill(3, "ACCOUNT", "PASSIVE", "TREE", 0, 5, 2);
    uint256 regIDFuzz = _createSkill(4, "ACCOUNT", "PASSIVE", "TREE", 0, 5, tier); // fuzz test

    // test under tree tier
    for (uint256 i; i < 4; i++) {
      _upgradeSkill(alice.index, alice.id, 1);

      vm.prank(alice.operator);
      vm.expectRevert("SkillUpgrade: unmet prerequisites");
      _SkillUpgradeSystem.executeTyped(alice.id, 2);

      vm.prank(alice.operator);
      vm.expectRevert("SkillUpgrade: unmet prerequisites");
      _SkillUpgradeSystem.executeTyped(alice.id, 3);
    }
    assertTrue(LibSkill.meetsTreePrerequisites(components, alice.id, regID1));
    assertFalse(LibSkill.meetsTreePrerequisites(components, alice.id, regID2));
    assertFalse(LibSkill.meetsTreePrerequisites(components, alice.id, regID3));

    // test first tier
    _upgradeSkill(alice.index, alice.id, 1);
    _upgradeSkill(alice.index, alice.id, 2);
    vm.prank(alice.operator);
    vm.expectRevert("SkillUpgrade: unmet prerequisites");
    _SkillUpgradeSystem.executeTyped(alice.id, 3);

    // test under second tier
    for (uint256 i; i < 3; i++) {
      _upgradeSkill(alice.index, alice.id, 2);
      vm.prank(alice.operator);
      vm.expectRevert("SkillUpgrade: unmet prerequisites");
      _SkillUpgradeSystem.executeTyped(alice.id, 3);
    }
    assertTrue(LibSkill.meetsTreePrerequisites(components, alice.id, regID1));
    assertTrue(LibSkill.meetsTreePrerequisites(components, alice.id, regID2));
    assertFalse(LibSkill.meetsTreePrerequisites(components, alice.id, regID3));

    // test second tier
    _upgradeSkill(alice.index, alice.id, 2);
    _upgradeSkill(alice.index, alice.id, 3);

    if (tier <= 2) {
      // would be qualified for up to tier 2
      assertTrue(LibSkill.meetsTreePrerequisites(components, alice.id, regIDFuzz));
      _upgradeSkill(alice.index, alice.id, 4);
    } else {
      // not yet qualified for >= tier 3
      assertFalse(LibSkill.meetsTreePrerequisites(components, alice.id, regIDFuzz));
      vm.prank(alice.operator);
      vm.expectRevert("SkillUpgrade: unmet prerequisites");
      _SkillUpgradeSystem.executeTyped(alice.id, 4);

      // setting points up proper
      vm.startPrank(deployer);
      LibDataEntity.set(
        components,
        alice.id,
        0,
        "TREESKILL_POINTS_USE",
        LibSkill.getTreeTierPoints(tier)
      );
      vm.stopPrank();

      assertTrue(LibSkill.meetsTreePrerequisites(components, alice.id, regIDFuzz));
      _upgradeSkill(alice.index, alice.id, 4);
    }
  }

  ////////////////
  // EFFECTS

  function testEffectStats() public {
    uint256 regID = _createSkill(1, "KAMI", "PASSIVE", 0, 5);
    uint256 regEffID = _createSkillEffect(1, "STAT", "HEALTH", 10);
    uint256 petID = _mintPet(alice.index);

    Stat memory ogStat = LibStat.getHealth(components, petID);
    _upgradeSkill(alice.index, petID, 1);
    Stat memory newStat = LibStat.getHealth(components, petID);

    Stat memory expectedStat = Stat(ogStat.base, ogStat.shift + 10, ogStat.boost, ogStat.sync);
    assertEq(keccak256(abi.encode(expectedStat)), keccak256(abi.encode(newStat)));
  }

  function testEffectGeneral() public {
    uint256 regID = _createSkill(1, "KAMI", "PASSIVE", 0, 5);
    uint256 regEffID = _createSkillEffect(1, "HARVEST", "DRAIN", 10);
    uint256 petID = _mintPet(alice.index);

    int256 ogDrain = LibBonus.getRaw(components, petID, "HARVEST_DRAIN");
    _upgradeSkill(alice.index, petID, 1);
    int256 newDrain = LibBonus.getRaw(components, petID, "HARVEST_DRAIN");

    assertEq(ogDrain + 10, newDrain);
  }
}
