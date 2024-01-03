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
    initStockTraits();

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
    initMinTraits();

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

  function testTraitDistributionBlockless() public {
    initMinTraits();

    uint numPets = 1000;

    // mint flow
    uint256 playerIndex = 0;
    uint initialLoc = LibAccount.getLocation(components, _getAccount(playerIndex));
    _moveAccount(playerIndex, 4);

    vm.roll(_currBlock++);
    _giveMint20(playerIndex, numPets);
    vm.startPrank(_getOwner(playerIndex));
    uint256[] memory petIDs = abi.decode(_Pet721MintSystem.executeTyped(numPets), (uint[]));
    vm.stopPrank();

    vm.roll(_currBlock++);
    vm.startPrank(_getOperator(playerIndex));
    for (uint i = 0; i < petIDs.length; i++) {
      _Pet721RevealSystem.executeTyped(LibPet.idToIndex(components, petIDs[i]));
    }

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
}
