// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

// test bonuses interactions with harvest
contract HarvestBonusTest is SetupTemplate {
  uint256 aKamiID;

  function setUp() public override {
    super.setUp();

    aKamiID = _mintKami(alice);
  }

  function testHarvestNodeBonus() public {
    uint32 nodeIndex = 1;
    _addNodeBonus(nodeIndex, "HARVEST_BONUS", 11);

    uint256 prodID = _startHarvest(aKamiID, nodeIndex);
    _fastForward(_idleRequirement + 50);

    // check bonus
    assertEq(LibBonus.getFor(components, "HARVEST_BONUS", aKamiID), 11);

    // collect harvest, bonus should stay
    _collectHarvest(prodID);
    assertEq(LibBonus.getFor(components, "HARVEST_BONUS", aKamiID), 11);
    _fastForward(_idleRequirement + 50);

    // stop harvest, bonus should be removed
    _stopHarvest(prodID);
    assertEq(LibBonus.getFor(components, "HARVEST_BONUS", aKamiID), 0);
  }

  //////////////////
  // UTILS

  function _addNodeBonus(uint32 nodeIndex, string memory bonusType, int256 value) internal {
    vm.startPrank(deployer);
    __NodeRegistrySystem.addBonus(abi.encode(nodeIndex, bonusType, value));
    vm.stopPrank();
  }
}
