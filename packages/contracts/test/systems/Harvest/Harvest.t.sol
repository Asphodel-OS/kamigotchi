// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract HarvestTest is SetupTemplate {
  uint256 aKamiID;

  function setUp() public override {
    super.setUp();

    aKamiID = _mintKami(alice);
  }

  function testHarvestShape() public {
    uint32 nodeIndex = 1;

    uint256 prodID = _startHarvestByIndex(aKamiID, nodeIndex);
    _fastForward(_idleRequirement + 50);

    _collectHarvest(prodID);
    _fastForward(_idleRequirement + 50);

    _stopHarvest(prodID);
  }

  function testHarvestStart() public {
    uint32 nodeIndex = 1;
    uint256 nodeID = LibNode.getByIndex(components, nodeIndex);

    uint256 prodID = _startHarvestByIndex(aKamiID, nodeIndex);
    vm.assertEq(prodID, LibHarvest.getForKami(components, aKamiID));

    // try to start harvest again, fail
    vm.prank(alice.operator);
    vm.expectRevert("kami not RESTING");
    _HarvestStartSystem.executeTyped(aKamiID, nodeID);
  }

  function testHarvestCollects() public {
    uint32 nodeIndex = 1;
    uint256 expectedTotal;

    uint256 prodID = _startHarvestByIndex(aKamiID, nodeIndex);

    for (uint256 i = 0; i < 10; i++) {
      _fastForward(_idleRequirement + 15 minutes);
      expectedTotal += LibHarvest.calcBounty(components, prodID);
      _collectHarvest(prodID);
      assertEq(LibHarvest.getBalance(components, prodID), 0, "har bal mismatch"); // harvest balance resets upon collect
      assertEq(_getItemBal(alice, 1), expectedTotal, "output bal mismatch"); // total farmed goes to account
    }

    // catching balance in the middle of a sync
    _fastForward(_idleRequirement + 15 minutes);
    assertEq(LibHarvest.getBalance(components, prodID), 0, "pre-sync mismatch");
    uint256 expectedBounty = LibHarvest.calcBounty(components, prodID);
    _sync(prodID);
    expectedTotal += expectedBounty;
    assertEq(LibHarvest.getBalance(components, prodID), expectedBounty, "post-sync mismatch");

    _fastForward(_idleRequirement + 15 minutes);
    expectedTotal += LibHarvest.calcBounty(components, prodID);
    _stopHarvest(prodID);
    assertEq(LibHarvest.getBalance(components, prodID), 0, "post-stop mismatch");
    assertEq(_getItemBal(alice, 1), expectedTotal, "end total mismatch");
  }

  function testHarvestIntensityReset() public {
    uint256 prodID = _startHarvestByIndex(aKamiID, 1);
    _fastForward(_idleRequirement);

    // harvesting for a while, high intensity
    _fastForward(100 hours);
    uint256 intensity = LibHarvest.calcIntensity(components, prodID, aKamiID);
    assertTrue(intensity > 0, "initial intensity mismatch");

    // use item, reset intensity
    _feedKami(alice, aKamiID);
    uint256 newIntensity = LibHarvest.calcIntensity(components, prodID, aKamiID);
    assertTrue(intensity > newIntensity, "intensity reset mismatch");
  }

  /////////////////
  // UTILS

  function _sync(uint256 prodID) internal {
    vm.startPrank(deployer);
    LibHarvest.sync(components, prodID);
    vm.stopPrank();
  }
}
