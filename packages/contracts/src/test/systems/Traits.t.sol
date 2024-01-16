// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

import { ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { ID as IndexColorCompID } from "components/IndexColorComponent.sol";

contract TraitsTest is SetupTemplate {
  uint[] internal _listingIDs;
  uint[] internal _nodeIDs;
  mapping(uint => uint[]) internal _petIDs;

  function setUp() public override {
    super.setUp();

    _setConfig("MINT_ACCOUNT_MAX", 1e9);
    _setConfig("ACCOUNT_STAMINA_BASE", 1e9);

    _createRoom("testRoom1", 1, 4, 0, 0);
    _createRoom("testRoom4", 4, 1, 0, 0);

    _registerAccount(0);
  }

  /////////////////
  // HELPER FUNCTIONS

  function _calcStatsFromTraits(uint petID) internal view returns (uint[] memory) {
    uint health = LibConfig.getValueOf(components, "KAMI_BASE_HEALTH");
    uint power = LibConfig.getValueOf(components, "KAMI_BASE_POWER");
    uint violence = LibConfig.getValueOf(components, "KAMI_BASE_VIOLENCE");
    uint harmony = LibConfig.getValueOf(components, "KAMI_BASE_HARMONY");
    uint slots = LibConfig.getValueOf(components, "KAMI_BASE_SLOTS");

    // sum the stats from all traits
    uint traitRegistryID;
    uint[] memory traits = LibPet.getTraits(components, petID);
    for (uint i = 0; i < traits.length; i++) {
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
  function testTraitStats() public {
    _initStockTraits();

    uint numPets = 100;
    uint[] memory petIDs = _mintPets(0, numPets);

    uint petID;
    uint[] memory stats;
    for (uint i = 0; i < numPets; i++) {
      petID = petIDs[i];
      stats = _calcStatsFromTraits(petID);
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
    _initEmptyTraits();

    uint numPets = 300;
    uint[] memory petIDs = _mintPets(0, numPets);

    uint[] memory backgrounds = LibRegistryTrait.getAllOfType(components, IndexBackgroundCompID);
    uint[] memory bodies = LibRegistryTrait.getAllOfType(components, IndexBodyCompID);
    uint[] memory colors = LibRegistryTrait.getAllOfType(components, IndexColorCompID);
    uint[] memory faces = LibRegistryTrait.getAllOfType(components, IndexFaceCompID);
    uint[] memory hands = LibRegistryTrait.getAllOfType(components, IndexHandCompID);

    uint[] memory bgCounts = new uint[](backgrounds.length);
    uint[] memory bodyCounts = new uint[](bodies.length);
    uint[] memory colorCounts = new uint[](colors.length);
    uint[] memory faceCounts = new uint[](faces.length);
    uint[] memory handCounts = new uint[](hands.length);

    for (uint i = 0; i < numPets; i++) {
      bgCounts[LibRegistryTrait.getBackgroundIndex(components, petIDs[i])]++;
      bodyCounts[LibRegistryTrait.getBodyIndex(components, petIDs[i])]++;
      colorCounts[LibRegistryTrait.getColorIndex(components, petIDs[i])]++;
      faceCounts[LibRegistryTrait.getFaceIndex(components, petIDs[i])]++;
      handCounts[LibRegistryTrait.getHandIndex(components, petIDs[i])]++;
    }

    uint[][5] memory traits = [backgrounds, bodies, colors, faces, hands];
    uint[][5] memory counts = [bgCounts, bodyCounts, colorCounts, faceCounts, handCounts];

    // reporting
    uint count;
    string memory name;
    for (uint i = 0; i < traits.length; i++) {
      for (uint j = 0; j < traits[i].length; j++) {
        count = counts[i][j];
        name = LibRegistryTrait.getName(components, traits[i][j]);
        console.log("%s: %d", name, count);
      }
      console.log("\n");
    }
  }

  function testTraitDistributionBlockless() public {
    _initEmptyTraits();

    uint numPets = 300;

    // mint flow
    uint playerIndex = 0;
    _moveAccount(playerIndex, 4);

    vm.roll(_currBlock++);
    _giveMint20(playerIndex, numPets);
    vm.startPrank(_getOwner(playerIndex));
    uint[] memory petIDs = abi.decode(_Pet721MintSystem.executeTyped(numPets), (uint[]));
    vm.stopPrank();

    vm.roll(_currBlock++);
    vm.startPrank(_getOperator(playerIndex));
    for (uint i = 0; i < petIDs.length; i++) {
      _Pet721RevealSystem.executeTyped(LibPet.idToIndex(components, petIDs[i]));
    }

    uint[] memory backgrounds = LibRegistryTrait.getAllOfType(components, IndexBackgroundCompID);
    uint[] memory bodies = LibRegistryTrait.getAllOfType(components, IndexBodyCompID);
    uint[] memory colors = LibRegistryTrait.getAllOfType(components, IndexColorCompID);
    uint[] memory faces = LibRegistryTrait.getAllOfType(components, IndexFaceCompID);
    uint[] memory hands = LibRegistryTrait.getAllOfType(components, IndexHandCompID);

    uint[] memory bgCounts = new uint[](backgrounds.length);
    uint[] memory bodyCounts = new uint[](bodies.length);
    uint[] memory colorCounts = new uint[](colors.length);
    uint[] memory faceCounts = new uint[](faces.length);
    uint[] memory handCounts = new uint[](hands.length);

    for (uint i = 0; i < numPets; i++) {
      bgCounts[LibRegistryTrait.getBackgroundIndex(components, petIDs[i])]++;
      bodyCounts[LibRegistryTrait.getBodyIndex(components, petIDs[i])]++;
      colorCounts[LibRegistryTrait.getColorIndex(components, petIDs[i])]++;
      faceCounts[LibRegistryTrait.getFaceIndex(components, petIDs[i])]++;
      handCounts[LibRegistryTrait.getHandIndex(components, petIDs[i])]++;
    }

    uint[][5] memory traits = [backgrounds, bodies, colors, faces, hands];
    uint[][5] memory counts = [bgCounts, bodyCounts, colorCounts, faceCounts, handCounts];

    // reporting
    uint count;
    string memory name;
    for (uint i = 0; i < traits.length; i++) {
      for (uint j = 0; j < traits[i].length; j++) {
        count = counts[i][j];
        name = LibRegistryTrait.getName(components, traits[i][j]);
        console.log("%s: %d", name, count);
      }
      console.log("\n");
    }
  }
}
