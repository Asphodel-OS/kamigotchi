// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract SkillTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function testSkillBasicAccount() public {
    // create skill
    _createSkill(1, "PASSIVE", "TEST_SKILL", "test skill description");

    // register the account
    _registerAccount(0);
    uint256 accountID = _getAccount(0);

    // select skill
    _upgradeSkill(0, accountID, 1);

    // check if skills are added
    assertTrue(LibSkill.get(components, accountID, 1) != 0);
  }

  function testUseSkillPoints() public {
    // // create skill
    // _createSkill(1, "TEST_SKILL");
    // _createSkillRequirement(1, "USE", "SKILL_POINT", 0, 1);
    // // register the account
    // _registerAccount(0);
    // address operator = _getOperator(0);
    // uint256 accountID = _getAccount(0);
    // // select skill (fail - no points)
    // vm.prank(operator);
    // vm.expectRevert("SkillUpgrade: unmet requirements");
    // _SkillUpgradeSystem.executeTyped(accountID, 1);
    // // give points, accept
    // _giveSkillPoint(accountID, 1);
    // _upgradeSkill(0, accountID, 1);
    // // checks
    // assertTrue(LibSkill.queryBySkillType(components, accountID, "TEST_SKILL") != 0);
    // assertEq(LibSkill.getPoints(components, accountID), 0);
  }
}
