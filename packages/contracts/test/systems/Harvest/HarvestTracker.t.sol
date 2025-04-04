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

  function testTrackHarvestTime() public {
    uint256 startTime = block.timestamp;
    uint32 nodeIndex = 1;

    uint256 prodID = _startHarvest(aKamiID, nodeIndex);
    _fastForward(_idleRequirement + 50);

    // feed pet
    _feedKami(alice, aKamiID);
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
