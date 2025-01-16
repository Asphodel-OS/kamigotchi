// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract HarvestTrackerTest is SetupTemplate {
  uint256 aKamiID;

  function setUp() public override {
    super.setUp();

    aKamiID = _mintKami(alice);
  }

  function setUpItems() public override {
    _createFood(1, "Gum", "DESCRIPTION", 25, 0, ""); // itemIndex 1
  }

  function testTrackHarvestTime() public {
    uint256 startTime = block.timestamp;
    uint32 nodeIndex = 1;
    _giveItem(alice, 1, 10);

    uint256 prodID = _startHarvestByIndex(aKamiID, nodeIndex);
    _fastForward(_idleRequirement + 50);

    // feed pet
    _feedPet(aKamiID, 1);
    _fastForward(_idleRequirement + 50);

    // // collect harvest - does not inc time
    _collectHarvest(prodID);
    assertEq(0, LibData.get(components, alice.id, 0, "HARVEST_TIME"));

    // // stop harvest - logs time
    _fastForward(_idleRequirement + 50);
    _stopHarvest(prodID);
    assertEq(block.timestamp - startTime, LibData.get(components, alice.id, 0, "HARVEST_TIME"));
  }
}
