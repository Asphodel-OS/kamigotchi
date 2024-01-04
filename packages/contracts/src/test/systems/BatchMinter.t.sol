// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

import { BatchMintUtils } from "utils/BatchMintUtils.sol";
import { TraitWeights, TraitStats } from "systems/_721BatchMinterSystem.sol";
import { ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { ID as IndexColorCompID } from "components/IndexColorComponent.sol";

contract BatchMinterTest is SetupTemplate {
  BatchMintUtils internal _utils;

  function setUp() public override {
    super.setUp();

    _utils = new BatchMintUtils(components);
    vm.roll(_currBlock++);
  }

  /////////////////
  // Stats //
  /////////////////

  function testTraitStatOne() public {
    _initStockTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.setStats(_utils.getAllStats(components));
    vm.stopPrank();

    vm.prank(deployer);
    uint256 petID = __721BatchMinterSystem.batchMint(address(this), 1)[0];

    uint[] memory stats = _calcStatsFromTraits(petID);
    assertEq(stats[0], LibStat.getHealth(components, petID));
    assertEq(stats[1], LibStat.getPower(components, petID));
    assertEq(stats[2], LibStat.getViolence(components, petID));
    assertEq(stats[3], LibStat.getHarmony(components, petID));
    assertEq(stats[4], LibStat.getSlots(components, petID));
  }

  function testTraitStats() public {
    _initStockTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.setStats(_utils.getAllStats(components));
    vm.stopPrank();

    uint numPets = 100;
    uint[] memory petIDs = new uint[](numPets);
    for (uint i = 0; i < 10; i++) {
      vm.prank(deployer);
      uint[] memory tempIDs = __721BatchMinterSystem.batchMint(address(this), 10);
      for (uint j = 0; j < 10; j++) {
        petIDs[i * 10 + j] = tempIDs[j];
      }
    }

    for (uint i = 0; i < numPets; i++) {
      uint petID = petIDs[i];
      uint[] memory stats = _calcStatsFromTraits(petID);
      assertEq(stats[0], LibStat.getHealth(components, petID));
      assertEq(stats[1], LibStat.getPower(components, petID));
      assertEq(stats[2], LibStat.getViolence(components, petID));
      assertEq(stats[3], LibStat.getHarmony(components, petID));
      assertEq(stats[4], LibStat.getSlots(components, petID));
    }
  }

  ////////////////
  // UNIT TESTS //
  ////////////////

  function testStart() public {
    _initStockTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.setStats(_utils.getAllStats(components));
    vm.stopPrank();

    vm.prank(deployer);
    __721BatchMinterSystem.batchMint(address(this), 100);
  }

  function testDistribution() public {
    _initEmptyTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.setStats(_utils.getAllStats(components));
    vm.stopPrank();

    uint256 numPets = 1000;

    vm.prank(deployer);
    uint256[] memory petIDs = __721BatchMinterSystem.batchMint(address(this), numPets);

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

  ////////////////
  // UTIL TESTS //
  ////////////////

  function testUtils() public {
    _initStockTraits();

    TraitStats[] memory stats = _utils.getAllStats(components);
    assertEq(stats.length, 70);
  }

  function testSetStats() public {
    TraitStats[] memory stats = new TraitStats[](2);
    stats[0] = TraitStats(1, 2, 3, 4, 5);
    stats[1] = TraitStats(6, 7, 8, 9, 10);

    vm.startPrank(deployer);
    __721BatchMinterSystem.setStats(stats);
    vm.stopPrank();
  }

  function testSetTraits() public {
    _initStockTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    vm.stopPrank();
  }

  function testSetStatsLive() public {
    _initStockTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.setStats(_utils.getAllStats(components));
    vm.stopPrank();
  }

  //////////////////////
  // HELPER FUNCTIONS //
  //////////////////////

  function _calcStatsFromTraits(uint petID) internal view returns (uint[] memory) {
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
}
