// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract HarvestTrackerTest is SetupTemplate {
  uint256 aPetID;

  function setUp() public override {
    super.setUp();

    aPetID = _mintPet(alice);
  }

  function setUpItems() public override {
    _createFood(1, "Gum", "DESCRIPTION", 25, 0, ""); // itemIndex 1
  }

  function testTrackHarvestTime() public {
    uint256 startTime = block.timestamp;
    uint32 nodeIndex = 1;
    _giveItem(alice, 1, 10);

    uint256 prodID = _startProductionByIndex(aPetID, nodeIndex);
    _fastForward(_idleRequirement + 50);

    // feed pet
    _feedPet(aPetID, 1);
    _fastForward(_idleRequirement + 50);

    // // collect harvest - does not inc time
    _collectProduction(prodID);
    assertEq(0, LibData.get(components, alice.id, 0, "HARVEST_TIME"));

    // // stop harvest - logs time
    _fastForward(_idleRequirement + 50);
    _stopProduction(prodID);
    assertEq(block.timestamp - startTime, LibData.get(components, alice.id, 0, "HARVEST_TIME"));
  }
}
