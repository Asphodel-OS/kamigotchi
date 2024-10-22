// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";
import { Stat } from "solecs/components/types/Stat.sol";

contract SkillTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function _initSkillConfigs() internal override {
    _setConfigArray("KAMI_TREE_REQ", [uint32(0), 5, 15, 25, 40, 55, 75, 95]);
  }

  ////////////////
  // SKILLS

  function testSkillCreate() public {
    _createSkill(1, "ACCOUNT", 0, 1);
    _createSkillBonus(1, "TYPE", 1);
    _createSkillRequirement(1, "TYPE", "CURR_MIN", 0, 1);

    vm.prank(deployer);
    __SkillRegistrySystem.remove(1);
  }

  function testSkillBasicAccount() public {
    _createSkill(1, "ACCOUNT", 0, 1);

    // select skill
    _upgradeSkill(alice, alice.id, 1);
    assertTrue(LibSkill.get(components, alice.id, 1) != 0);
  }

  function testSkillBasicKami() public {
    _createSkill(1, "KAMI", 1, 1);
    uint256 kamiID = _mintKami(alice);

    _upgradeSkill(alice, kamiID, 1);
    assertTrue(LibSkill.get(components, kamiID, 1) != 0);
  }

  function testSkillReset() public {
    // create skills (total points: 12)
    _createSkill(1, "ACCOUNT", 0, 1);
    _createSkill(2, "ACCOUNT", 1, 1);
    _createSkillBonus(2, "BONUS_A", 2);
    _createSkill(3, "ACCOUNT", 1, 5);
    _createSkillBonus(3, "BONUS_A", 3);
    _createSkill(4, "ACCOUNT", 3, 2);
    _createSkillBonus(4, "BONUS_B", 5);

    // give skill points
    _giveSkillPoint(alice.id, 12);

    // upgrade skills
    _upgradeSkill(alice, alice.id, 1);
    _upgradeSkill(alice, alice.id, 2);
    for (uint256 i; i < 5; i++) _upgradeSkill(alice, alice.id, 3);
    for (uint256 i; i < 2; i++) _upgradeSkill(alice, alice.id, 4);

    // check bonuses and points
    assertEq(LibBonus.getForUint256(components, "BONUS_A", alice.id), 17);
    assertEq(LibBonus.getForUint256(components, "BONUS_B", alice.id), 10);
    assertEq(LibSkill.getPoints(components, alice.id), 0);
    assertEq(LibGetter.getBalanceOf(components, alice.id, "SKILL", 1), 1);
    assertEq(LibGetter.getBalanceOf(components, alice.id, "SKILL", 2), 1);
    assertEq(LibGetter.getBalanceOf(components, alice.id, "SKILL", 3), 5);
    assertEq(LibGetter.getBalanceOf(components, alice.id, "SKILL", 4), 2);

    // reset skills
    _resetSkills(alice.id);

    // check bonuses and points
    assertEq(LibBonus.getForUint256(components, "BONUS_A", alice.id), 0);
    assertEq(LibBonus.getForUint256(components, "BONUS_B", alice.id), 0);
    assertEq(LibSkill.getPoints(components, alice.id), 12);
    assertEq(LibGetter.getBalanceOf(components, alice.id, "SKILL", 1), 0);
    assertEq(LibGetter.getBalanceOf(components, alice.id, "SKILL", 2), 0);
    assertEq(LibGetter.getBalanceOf(components, alice.id, "SKILL", 3), 0);
    assertEq(LibGetter.getBalanceOf(components, alice.id, "SKILL", 4), 0);
  }

  // test whether skill upgrades are properly gated by skill point availability
  function testSkillPoints() public {
    _createSkill(1, "ACCOUNT", 1, 1);

    // select skill (fail - no points)
    vm.prank(_getOperator(0));
    vm.expectRevert("SkillUpgrade: unmet prerequisites");
    _SkillUpgradeSystem.executeTyped(alice.id, 1);

    // give points, accept
    _giveSkillPoint(alice.id, 1);
    _upgradeSkill(alice, alice.id, 1);

    // check if skills are added
    assertTrue(LibSkill.get(components, alice.id, 1) != 0);
    assertEq(LibSkill.getPoints(components, alice.id), 0);
  }

  // test whether skill upgrades are properly gated by skill cap
  function testSkillMax() public {
    _createSkill(1, "ACCOUNT", 0, 2);

    _upgradeSkill(alice, alice.id, 1);
    _upgradeSkill(alice, alice.id, 1);

    // accept x3 (expect fail)
    vm.prank(_getOperator(0));
    vm.expectRevert("SkillUpgrade: unmet prerequisites");
    _SkillUpgradeSystem.executeTyped(alice.id, 1);

    // check if skills are added
    assertTrue(LibSkill.get(components, alice.id, 1) != 0);
  }

  ////////////////
  // TREES

  function testCreateTree() public {
    uint256 regID = _createSkill(1, "ACCOUNT", "TREE", 0, 5, 1);
    (bool has, string memory tree, uint256 tier) = LibSkillRegistry.getTree(components, regID);
    assertFalse(regID == 0);
    assertTrue(has);
    assertEq(LibSkillRegistry.genTreeType("TREE"), tree);
    assertEq(1, tier);
  }

  function testSkillTreeBasic() public {
    uint256 regID1 = _createSkill(1, "ACCOUNT", "TREE", 1, 5, 0);
    uint256 regID2 = _createSkill(2, "ACCOUNT", "TREE", 2, 5, 0);
    uint256 regIDTiered = _createSkill(3, "ACCOUNT", "TREE", 1, 5, 1);
    string memory treeType = LibSkillRegistry.genTreeType("TREE");

    // giving account skill points to spend
    vm.prank(deployer);
    _SkillPointComponent.set(alice.id, 100);

    // test blank
    assertEq(LibBonus.getForUint256(components, treeType, alice.id), 0);
    assertTrue(LibSkill.meetsTreePrerequisites(components, alice.id, regID1));
    assertFalse(LibSkill.meetsTreePrerequisites(components, alice.id, regIDTiered));

    // test upgrade
    _upgradeSkill(alice, alice.id, 1);
    assertEq(LibBonus.getForUint256(components, treeType, alice.id), 1);
    _upgradeSkill(alice, alice.id, 2); // costs 2
    assertEq(LibBonus.getForUint256(components, treeType, alice.id), 3);

    // test fail (total 3 points, 5 needed)
    assertFalse(LibSkill.meetsTreePrerequisites(components, alice.id, regIDTiered));
    vm.prank(alice.operator);
    vm.expectRevert("SkillUpgrade: unmet prerequisites");
    _SkillUpgradeSystem.executeTyped(alice.id, 3);

    // test upgrade (5 points)
    _upgradeSkill(alice, alice.id, 2);
    assertEq(LibBonus.getForUint256(components, treeType, alice.id), 5);
    assertTrue(LibSkill.meetsTreePrerequisites(components, alice.id, regIDTiered));
    _upgradeSkill(alice, alice.id, 3);

    // test reset skills
    _resetSkills(alice.id);
    assertEq(LibBonus.getForUint256(components, treeType, alice.id), 0);
    assertFalse(LibSkill.meetsTreePrerequisites(components, alice.id, regIDTiered));
    vm.prank(alice.operator);
    vm.expectRevert("SkillUpgrade: unmet prerequisites");
    _SkillUpgradeSystem.executeTyped(alice.id, 3);
  }

  function testSkillTreeMultiple() public {
    uint256 regID1 = _createSkill(1, "ACCOUNT", "TREE", 1, 100, 0);
    uint256 regID2 = _createSkill(2, "ACCOUNT", "TREE", 1, 5, 1);
    uint256 regID3 = _createSkill(3, "ACCOUNT", "TREE", 1, 5, 2);
    uint256 regID4 = _createSkill(4, "ACCOUNT", "TREE", 1, 5, 3); // fuzz test
    string memory treeType = LibSkillRegistry.genTreeType("TREE");

    // giving account skill points to spend
    vm.prank(deployer);
    _SkillPointComponent.set(alice.id, 100);

    // test under tree tier
    for (uint256 i; i < 4; i++) {
      _upgradeSkill(alice, alice.id, 1);

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

    // // test first tier
    _upgradeSkill(alice, alice.id, 1);
    _upgradeSkill(alice, alice.id, 2);
    vm.prank(alice.operator);
    vm.expectRevert("SkillUpgrade: unmet prerequisites");
    _SkillUpgradeSystem.executeTyped(alice.id, 3);

    // test under second tier
    for (uint256 i; i < 3; i++) {
      _upgradeSkill(alice, alice.id, 2);
      vm.prank(alice.operator);
      vm.expectRevert("SkillUpgrade: unmet prerequisites");
      _SkillUpgradeSystem.executeTyped(alice.id, 3);
    }
    assertTrue(LibSkill.meetsTreePrerequisites(components, alice.id, regID1));
    assertTrue(LibSkill.meetsTreePrerequisites(components, alice.id, regID2));
    assertFalse(LibSkill.meetsTreePrerequisites(components, alice.id, regID3));

    // test second tier (curr at 5pts, set to 15)
    for (uint256 i; i < 10; i++) _upgradeSkill(alice, alice.id, 1);
    _upgradeSkill(alice, alice.id, 3);

    // test third tier
    assertFalse(LibSkill.meetsTreePrerequisites(components, alice.id, regID4));
    vm.prank(alice.operator);
    vm.expectRevert("SkillUpgrade: unmet prerequisites");
    _SkillUpgradeSystem.executeTyped(alice.id, 4);
    // set to 25 pts (tier 4)
    for (uint256 i; i < 10; i++) _upgradeSkill(alice, alice.id, 1);

    assertTrue(LibSkill.meetsTreePrerequisites(components, alice.id, regID4));
    _upgradeSkill(alice, alice.id, 4);
  }

  ////////////////
  // BONUSES

  function testSkillBonus() public {
    uint256 regID = _createSkill(1, "KAMI", 0, 5);
    uint256 regEffID = _createSkillBonus(1, "HARVEST_DRAIN", 10);
    uint256 kamiID = _mintKami(alice.index);

    assertEq(LibBonus.getFor(components, "HARVEST_DRAIN", kamiID), 0);
    _upgradeSkill(alice, kamiID, 1);
    assertEq(LibBonus.getFor(components, "HARVEST_DRAIN", kamiID), 10);
  }
}
