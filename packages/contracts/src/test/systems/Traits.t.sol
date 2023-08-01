// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

import { ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { ID as IndexColorCompID } from "components/IndexColorComponent.sol";

contract TraitTest is SetupTemplate {
  uint[] internal _listingIDs;
  uint[] internal _nodeIDs;
  mapping(uint => uint[]) internal _petIDs;

  function setUp() public override {
    super.setUp();

    _setConfig("MINT_ACCOUNT_MAX", 1e9);
    _setConfig("ACCOUNT_STAMINA_BASE", 1e9);

    _initCommonTraits();
    _initUncommonTraits();
    _initRareTraits();
    _initEpicTraits();
    _initMythicTraits();

    _createRoom("testRoom1", 1, 4, 0, 0);
    _createRoom("testRoom4", 4, 1, 0, 0);

    _registerAccount(0);
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

  function _getTraitWeight(uint traitIndex) internal view returns (uint) {
    uint registryID = LibRegistryTrait.getByTraitIndex(components, traitIndex);
    uint tier = LibStat.getRarity(components, registryID);
    return (tier > 0) ? 3 ** (tier - 1) : 0;
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

  // test that the distributions are as expected
  // TODO: confirm distributions fall within 99.9 percentile statistical deviation
  function testTraitDistribution() public {
    uint numPets = 1000;
    uint[] memory petIDs = _mintPets(0, numPets);

    uint[] memory bodies = LibRegistryTrait.getAllOfType(components, IndexBodyCompID);
    uint[] memory hands = LibRegistryTrait.getAllOfType(components, IndexHandCompID);
    uint[] memory faces = LibRegistryTrait.getAllOfType(components, IndexFaceCompID);
    uint[] memory backgrounds = LibRegistryTrait.getAllOfType(components, IndexBackgroundCompID);
    uint[] memory colors = LibRegistryTrait.getAllOfType(components, IndexColorCompID);

    uint[] memory bodyCounts = new uint[](bodies.length + 1);
    uint[] memory handCounts = new uint[](hands.length + 1);
    uint[] memory faceCounts = new uint[](faces.length + 1);
    uint[] memory bgCounts = new uint[](backgrounds.length + 1);
    uint[] memory colorCounts = new uint[](colors.length + 1);

    for (uint i = 0; i < numPets; i++) {
      bodyCounts[LibRegistryTrait.getBodyIndex(components, petIDs[i])]++;
      handCounts[LibRegistryTrait.getHandIndex(components, petIDs[i])]++;
      faceCounts[LibRegistryTrait.getFaceIndex(components, petIDs[i])]++;
      bgCounts[LibRegistryTrait.getBackgroundIndex(components, petIDs[i])]++;
      colorCounts[LibRegistryTrait.getColorIndex(components, petIDs[i])]++;
    }

    // reporting
    for (uint i = 1; i <= bodies.length; i++) {
      console.log("%s: %d", LibRegistryTrait.getName(components, bodies[i - 1]), bodyCounts[i]);
    }
    console.log("\n");

    for (uint i = 1; i <= hands.length; i++) {
      console.log("%s: %d", LibRegistryTrait.getName(components, hands[i - 1]), handCounts[i]);
    }
    console.log("\n");

    for (uint i = 1; i <= faces.length; i++) {
      console.log("%s: %d", LibRegistryTrait.getName(components, faces[i - 1]), faceCounts[i]);
    }
    console.log("\n");

    for (uint i = 1; i <= backgrounds.length; i++) {
      console.log("%s: %d", LibRegistryTrait.getName(components, backgrounds[i - 1]), bgCounts[i]);
    }
    console.log("\n");

    for (uint i = 1; i <= colors.length; i++) {
      console.log("%s: %d", LibRegistryTrait.getName(components, colors[i - 1]), colorCounts[i]);
    }
    console.log("\n");
  }
}
