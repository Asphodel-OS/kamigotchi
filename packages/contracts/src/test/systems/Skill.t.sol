// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract SkillTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  // test whether skill upgrades are properly gated by skill point availability
  function testSkillBasicAccount() public {
    uint256 accountID = _getAccount(0);
    _createSkill(1, "ACCOUNT", "PASSIVE", "TEST_SKILL", 0, 1, "test skill description");

    // select skill
    _upgradeSkill(0, accountID, 1);
    assertTrue(LibSkill.get(components, accountID, 1) != 0);
  }

  // test whether skill upgrades are properly gated by skill point availability
  function testSkillPoints() public {
    uint256 accountID = _getAccount(0);
    _createSkill(1, "ACCOUNT", "PASSIVE", "TEST_SKILL", 1, 1, "test skill description");

    // select skill (fail - no points)
    vm.prank(_getOperator(0));
    vm.expectRevert("SkillUpgrade: unmet prerequisites");
    _SkillUpgradeSystem.executeTyped(accountID, 1);

    // give points, accept
    _giveSkillPoint(accountID, 1);
    _upgradeSkill(0, accountID, 1);

    // check if skills are added
    assertTrue(LibSkill.get(components, accountID, 1) != 0);
    assertEq(LibSkill.getPoints(components, accountID), 0);
  }

  // test whether skill upgrades are properly gated by skill cap
  function testSkillMax() public {
    uint256 accountID = _getAccount(0);
    _createSkill(1, "ACCOUNT", "PASSIVE", "TEST_SKILL", 0, 2, "test skill description");

    _upgradeSkill(0, accountID, 1);
    _upgradeSkill(0, accountID, 1);

    // accept x3 (expect fail)
    vm.prank(_getOperator(0));
    vm.expectRevert("SkillUpgrade: unmet prerequisites");
    _SkillUpgradeSystem.executeTyped(accountID, 1);

    // check if skills are added
    assertTrue(LibSkill.get(components, accountID, 1) != 0);
  }
}
