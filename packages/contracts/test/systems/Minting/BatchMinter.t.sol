// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { TraitWeights, TraitStats } from "systems/_721BatchMinterSystem.sol";
import { ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { ID as IndexColorCompID } from "components/IndexColorComponent.sol";

contract BatchMinterTest is SetupTemplate {
  function setUp() public override {
    super.setUp();

    vm.roll(_currBlock++);
  }

  function setUpTraits() public override {}

  function setUpMint() public override {}

  /////////////////
  // Stats //
  /////////////////

  function testTraitStatOne() public {
    _initStockTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    vm.stopPrank();

    vm.prank(deployer);
    uint256 kamiID = __721BatchMinterSystem.batchMint(1)[0];

    int32[] memory stats = _calcStatsFromTraits(kamiID);
    assertEq(stats[0], LibStat.get(components, "HEALTH", kamiID).base);
    assertEq(stats[1], LibStat.get(components, "POWER", kamiID).base);
    assertEq(stats[2], LibStat.get(components, "VIOLENCE", kamiID).base);
    assertEq(stats[3], LibStat.get(components, "HARMONY", kamiID).base);
    assertEq(stats[4], LibStat.get(components, "SLOTS", kamiID).base);
  }

  function testTraitStats() public {
    _initStockTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    vm.stopPrank();

    uint numPets = 100;
    uint[] memory kamiIDs = new uint[](numPets);
    for (uint i = 0; i < 10; i++) {
      vm.prank(deployer);
      uint[] memory tempIDs = __721BatchMinterSystem.batchMint(10);
      for (uint j = 0; j < 10; j++) {
        kamiIDs[i * 10 + j] = tempIDs[j];
      }
    }

    for (uint i = 0; i < numPets; i++) {
      uint kamiID = kamiIDs[i];
      int32[] memory stats = _calcStatsFromTraits(kamiID);
      assertEq(stats[0], LibStat.get(components, "HEALTH", kamiID).base);
      assertEq(stats[1], LibStat.get(components, "POWER", kamiID).base);
      assertEq(stats[2], LibStat.get(components, "VIOLENCE", kamiID).base);
      assertEq(stats[3], LibStat.get(components, "HARMONY", kamiID).base);
      assertEq(stats[4], LibStat.get(components, "SLOTS", kamiID).base);
    }
  }

  ////////////////
  // UNIT TESTS //
  ////////////////

  function testStart() public {
    _initStockTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    vm.stopPrank();

    vm.prank(deployer);
    __721BatchMinterSystem.batchMint(100);
  }

  function testDistribution() public {
    _initEmptyTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    vm.stopPrank();

    uint256 numPets = 1000;

    vm.prank(deployer);
    uint256[] memory kamiIDs = __721BatchMinterSystem.batchMint(numPets);

    uint[] memory backgrounds = LibTraitRegistry.getAllOfType(components, "BACKGROUND");
    uint[] memory bodies = LibTraitRegistry.getAllOfType(components, "BODY");
    uint[] memory colors = LibTraitRegistry.getAllOfType(components, "COLOR");
    uint[] memory faces = LibTraitRegistry.getAllOfType(components, "FACE");
    uint[] memory hands = LibTraitRegistry.getAllOfType(components, "HAND");

    uint[] memory bgCounts = new uint[](backgrounds.length);
    uint[] memory bodyCounts = new uint[](bodies.length);
    uint[] memory colorCounts = new uint[](colors.length);
    uint[] memory faceCounts = new uint[](faces.length);
    uint[] memory handCounts = new uint[](hands.length);

    for (uint i = 0; i < numPets; i++) {
      bgCounts[LibTraitRegistry.getBackgroundIndex(components, kamiIDs[i])]++;
      bodyCounts[LibTraitRegistry.getBodyIndex(components, kamiIDs[i])]++;
      colorCounts[LibTraitRegistry.getColorIndex(components, kamiIDs[i])]++;
      faceCounts[LibTraitRegistry.getFaceIndex(components, kamiIDs[i])]++;
      handCounts[LibTraitRegistry.getHandIndex(components, kamiIDs[i])]++;
    }

    uint[][5] memory traits = [backgrounds, bodies, colors, faces, hands];
    uint[][5] memory counts = [bgCounts, bodyCounts, colorCounts, faceCounts, handCounts];

    // reporting
    uint count;
    string memory name;
    for (uint i = 0; i < traits.length; i++) {
      for (uint j = 0; j < traits[i].length; j++) {
        count = counts[i][j];
        name = LibTraitRegistry.getName(components, traits[i][j]);
        console.log("%s: %d", name, count);
      }
      console.log("\n");
    }
  }

  ////////////////
  // UTIL TESTS //
  ////////////////

  function testSetTraits() public {
    _initStockTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    vm.stopPrank();
  }

  //////////////////////
  // HELPER FUNCTIONS //
  //////////////////////

  function _calcStatsFromTraits(uint kamiID) internal view returns (int32[] memory) {
    int32 health = int32(int(LibConfig.get(components, "KAMI_BASE_HEALTH")));
    int32 power = int32(int(LibConfig.get(components, "KAMI_BASE_POWER")));
    int32 violence = int32(int(LibConfig.get(components, "KAMI_BASE_VIOLENCE")));
    int32 harmony = int32(int(LibConfig.get(components, "KAMI_BASE_HARMONY")));
    int32 slots = int32(int(LibConfig.get(components, "KAMI_BASE_SLOTS")));

    // sum the stats from all traits
    uint256 traitRegistryID;
    uint256[] memory traits = LibKami.getTraits(components, kamiID);
    for (uint256 i = 0; i < traits.length; i++) {
      traitRegistryID = traits[i];
      health += LibStat.get(components, "HEALTH", traitRegistryID).base;
      power += LibStat.get(components, "POWER", traitRegistryID).base;
      violence += LibStat.get(components, "VIOLENCE", traitRegistryID).base;
      harmony += LibStat.get(components, "HARMONY", traitRegistryID).base;
      slots += LibStat.get(components, "SLOTS", traitRegistryID).base;
    }

    int32[] memory stats = new int32[](5);
    stats[0] = health;
    stats[1] = power;
    stats[2] = violence;
    stats[3] = harmony;
    stats[4] = slots;

    return stats;
  }
}
