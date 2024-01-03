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
  // INIT TRAITS //
  /////////////////

  function initStockTraits() internal {
    _initCommonTraits();
    _initUncommonTraits();
    _initRareTraits();
    _initEpicTraits();
    _initMythicTraits();
  }

  /// @notice min amount of traits for distribution testing
  function initMinTraits() internal {
    // Backgrounds
    registerTrait(0, 10, 0, 0, 0, 0, 9, "", "BG Common", "BACKGROUND");
    registerTrait(1, 0, 1, 0, 0, 0, 8, "", "BG Uncommon", "BACKGROUND");
    registerTrait(2, 0, 0, 1, 0, 0, 7, "", "BG Rare", "BACKGROUND");
    registerTrait(3, 0, 0, 0, 1, 0, 6, "", "BG Epic", "BACKGROUND");
    registerTrait(4, 0, 0, 0, 1, 0, 5, "", "BG Mythic", "BACKGROUND");

    // Bodies
    registerTrait(0, 0, 0, 0, 0, 0, 9, "INSECT", "Body Common", "BODY");
    registerTrait(1, 0, 1, 0, 0, 0, 8, "SCRAP", "Body Uncommon", "BODY");
    registerTrait(2, 0, 0, 1, 0, 0, 7, "EERIE", "Body Rare", "BODY");
    registerTrait(3, 0, 0, 0, 1, 0, 6, "NORMAL", "Body Epic", "BODY");
    registerTrait(4, 0, 0, 0, 1, 0, 5, "SCRAP", "Body Mythic", "BODY");

    // Colors
    registerTrait(0, 10, 0, 0, 0, 0, 9, "", "Color Common", "COLOR");
    registerTrait(1, 0, 1, 0, 0, 0, 8, "", "Color Uncommon", "COLOR");
    registerTrait(2, 0, 0, 1, 0, 0, 7, "", "Color Rare", "COLOR");
    registerTrait(3, 0, 0, 0, 1, 0, 6, "", "Color Epic", "COLOR");
    registerTrait(4, 0, 0, 0, 1, 0, 5, "", "Color Mythic", "COLOR");

    // Faces
    registerTrait(0, 0, 0, 0, 0, 0, 9, "", "Face Common", "FACE");
    registerTrait(1, 0, 1, 0, 0, 0, 8, "", "Face Uncommon", "FACE");
    registerTrait(2, 0, 0, 1, 0, 0, 7, "", "Face Rare", "FACE");
    registerTrait(3, 0, 0, 0, 1, 0, 6, "", "Face Epic", "FACE");
    registerTrait(4, 0, 0, 0, 1, 0, 5, "", "Face Mythic", "FACE");

    // Hands
    registerTrait(0, 0, 0, 0, 0, 0, 9, "INSECT", "Hands Common", "HAND");
    registerTrait(1, 0, 1, 0, 0, 0, 8, "SCRAP", "Hands Uncommon", "HAND");
    registerTrait(2, 0, 0, 1, 0, 0, 7, "EERIE", "Hands Rare", "HAND");
    registerTrait(3, 0, 0, 0, 1, 0, 6, "NORMAL", "Hands Epic", "HAND");
    registerTrait(4, 0, 0, 0, 1, 0, 5, "SCRAP", "Hands Mythic", "HAND");
  }

  ////////////////
  // UNIT TESTS //
  ////////////////

  function testStart() public {
    initStockTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.setStats(_utils.getAllStats(components));
    vm.stopPrank();

    vm.prank(deployer);
    __721BatchMinterSystem.batchMint(address(this), 100);
  }

  function testDistribution() public {
    initMinTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.setStats(_utils.getAllStats(components));
    vm.stopPrank();

    uint256 numPets = 1000;

    vm.prank(deployer);
    uint256[] memory petIDs = __721BatchMinterSystem.batchMint(address(this), numPets);

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

  ////////////////
  // UTIL TESTS //
  ////////////////

  function testUtils() public {
    initStockTraits();

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
    initStockTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    vm.stopPrank();
  }

  function testSetStatsLive() public {
    initStockTraits();

    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.setStats(_utils.getAllStats(components));
    vm.stopPrank();
  }
}
