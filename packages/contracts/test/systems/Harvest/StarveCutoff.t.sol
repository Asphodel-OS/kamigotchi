// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract StarveCutoffTest is SetupTemplate {
  uint256 aKamiID;
  uint256 prodID;

  function setUp() public override {
    super.setUp();
    aKamiID = _mintKami(alice);
    prodID = _startHarvest(aKamiID, 1);
    _fastForward(_idleRequirement + 50);
  }

  // healthy kami should earn bounty normally
  function testBountyNormalWhenHealthy() public {
    assertTrue(LibKami.isHealthy(components, aKamiID), "should be healthy");
    uint256 bounty = LibHarvest.calcBounty(components, prodID);
    assertTrue(bounty > 0, "healthy kami should earn bounty");
  }

  // bounty should never exceed max MUSU sustainable by current HP
  function testBountyCappedByHP() public {
    uint256 maxMusu = LibHarvest.calcMaxMusu(components, aKamiID);
    assertTrue(maxMusu > 0, "should have max musu budget");

    // fast forward far enough that raw bounty would greatly exceed maxMusu
    _fastForward(200 hours);
    uint256 bounty = LibHarvest.calcBounty(components, prodID);

    assertLe(bounty, maxMusu, "bounty should be capped by HP budget");
    assertEq(bounty, maxMusu, "bounty should hit the cap exactly");
  }

  // after HP is drained to 0, bounty should be 0
  function testBountyZeroAfterDrained() public {
    // fast forward and sync to drain HP
    _fastForward(200 hours);
    ExternalCaller.kamiSync(aKamiID);

    assertFalse(LibKami.isHealthy(components, aKamiID), "should be at 0 HP");

    // further time passes — bounty should stay at 0
    _fastForward(1 hours);
    uint256 bounty = LibHarvest.calcBounty(components, prodID);
    assertEq(bounty, 0, "drained kami should earn nothing");
  }

  // after healing back above 0 HP, bounty should return
  function testBountyReturnsAfterHealing() public {
    // drain to 0
    _fastForward(200 hours);
    ExternalCaller.kamiSync(aKamiID);
    assertFalse(LibKami.isHealthy(components, aKamiID), "should be drained");

    // heal back up
    _healKami(aKamiID, 25);
    assertTrue(LibKami.isHealthy(components, aKamiID), "should be healed");

    // bounty should work again
    _fastForward(10 minutes);
    uint256 bounty = LibHarvest.calcBounty(components, prodID);
    assertTrue(bounty > 0, "healed kami should earn bounty");
  }

  // accumulated balance should be preserved (only new bounty stops)
  function testAccumulatedBalancePreserved() public {
    // earn some bounty and sync it into balance
    _fastForward(5 minutes);
    ExternalCaller.kamiSync(aKamiID);
    uint256 balanceBeforeDrain = LibHarvest.getBalance(components, prodID);
    assertTrue(balanceBeforeDrain > 0, "should have earned something");

    // drain HP to 0
    _fastForward(200 hours);
    ExternalCaller.kamiSync(aKamiID);

    // balance should still include what was earned before
    uint256 balanceAfterDrain = LibHarvest.getBalance(components, prodID);
    assertGe(balanceAfterDrain, balanceBeforeDrain, "accumulated balance should be preserved");
  }
}
