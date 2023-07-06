// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract MurderTest is SetupTemplate {
  uint _currTime;
  uint _idleRequirement;
  uint[] internal _listingIDs;
  uint[] internal _nodeIDs;
  mapping(uint => uint[]) internal _petIDs;

  function setUp() public override {
    super.setUp();

    _registerAccount(0);

    _initCommonTraits();
    _initUncommonTraits();
    _initRareTraits();
    _initEpicTraits();
    _initMythicTraits();
  }

  /////////////////
  // HELPER FUNCTIONS

  function _calcStats(uint petID) internal view returns (uint[] memory) {
    uint256 health = LibConfig.getValueOf(components, "KAMI_BASE_HEALTH");
    uint256 power = LibConfig.getValueOf(components, "KAMI_BASE_POWER");
    uint256 violence = LibConfig.getValueOf(components, "KAMI_BASE_VIOLENCE");
    uint256 harmony = LibConfig.getValueOf(components, "KAMI_BASE_HARMONY");
    uint256 slots = LibConfig.getValueOf(components, "KAMI_BASE_SLOTS");

    // sum the stats from all traits
    uint256 traitRegistryID;
    uint256[] memory traits = LibPet.getTraits(components, petID);
    for (uint256 i = 0; i < traits.length; i++) {
      traitRegistryID = traits[i];
      health += LibStat.getHealth(components, traitRegistryID);
      power += LibStat.getPower(components, traitRegistryID);
      violence += LibStat.getViolence(components, traitRegistryID);
      harmony += LibStat.getHarmony(components, traitRegistryID);
      slots += LibStat.getSlots(components, traitRegistryID);
    }

    uint[] memory stats = new uint[](5);
    stats[0] = health;
    stats[1] = power;
    stats[2] = violence;
    stats[3] = harmony;
    stats[4] = slots;

    return stats;
  }

  /////////////////
  // TESTS

  // test that a kami's stats align with its traits upon creation
  // NOTE: kinda pointlesss unit test, maybe useful for ensuring stats dont change
  function testTraitStats() public {
    uint numPets = 100;
    uint[] memory petIDs = _mintPets(0, numPets);

    uint petID;
    uint[] memory stats;
    for (uint i = 0; i < numPets; i++) {
      petID = petIDs[i];
      stats = _calcStats(petID);
      assertEq(stats[0], LibStat.getHealth(components, petID));
      assertEq(stats[1], LibStat.getPower(components, petID));
      assertEq(stats[2], LibStat.getViolence(components, petID));
      assertEq(stats[3], LibStat.getHarmony(components, petID));
      assertEq(stats[4], LibStat.getSlots(components, petID));
    }
  }
}
