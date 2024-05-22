// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

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

    // accounts must be created after new config set
    _createOwnerOperatorPairs(25); // create 10 pairs of Owners/Operators
    _registerAccounts(10);
  }

  function setUpMint() public override {
    return;
  }

  function setUpAccounts() public override {
    return;
  }

  /////////////////
  // HELPER FUNCTIONS

  function _calcStatsFromTraits(uint petID) internal view returns (int32[] memory) {
    int32 health = int32(int(LibConfig.get(components, "KAMI_BASE_HEALTH")));
    int32 power = int32(int(LibConfig.get(components, "KAMI_BASE_POWER")));
    int32 violence = int32(int(LibConfig.get(components, "KAMI_BASE_VIOLENCE")));
    int32 harmony = int32(int(LibConfig.get(components, "KAMI_BASE_HARMONY")));
    int32 slots = int32(int(LibConfig.get(components, "KAMI_BASE_SLOTS")));

    // sum the stats from all traits
    uint traitRegistryID;
    uint[] memory traits = LibPet.getTraits(components, petID);
    for (uint i = 0; i < traits.length; i++) {
      traitRegistryID = traits[i];
      health += LibStat.getHealth(components, traitRegistryID).base;
      power += LibStat.getPower(components, traitRegistryID).base;
      violence += LibStat.getViolence(components, traitRegistryID).base;
      harmony += LibStat.getHarmony(components, traitRegistryID).base;
      slots += LibStat.getSlots(components, traitRegistryID).base;
    }

    int32[] memory stats = new int32[](5);
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
  function testTraitStats() public {
    _initStockTraits();
    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.batchMint(150);
    vm.stopPrank();

    uint numPets = 100;
    uint[] memory petIDs = _mintPets(0, numPets);

    uint petID;
    int32[] memory stats;
    for (uint i = 0; i < numPets; i++) {
      petID = petIDs[i];
      stats = _calcStatsFromTraits(petID);
      assertEq(stats[0], LibStat.getHealth(components, petID).base);
      assertEq(stats[1], LibStat.getPower(components, petID).base);
      assertEq(stats[2], LibStat.getViolence(components, petID).base);
      assertEq(stats[3], LibStat.getHarmony(components, petID).base);
      assertEq(stats[4], LibStat.getSlots(components, petID).base);
    }
  }

  // test that the distributions are as expected
  // TODO: confirm distributions fall within 99.9 percentile statistical deviation
  function testTraitDistribution() public {
    uint numPets = 300;

    _initEmptyTraits();
    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    uint[] memory petIDs = __721BatchMinterSystem.batchMint(numPets);
    vm.stopPrank();

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
      bgCounts[LibTraitRegistry.getBackgroundIndex(components, petIDs[i])]++;
      bodyCounts[LibTraitRegistry.getBodyIndex(components, petIDs[i])]++;
      colorCounts[LibTraitRegistry.getColorIndex(components, petIDs[i])]++;
      faceCounts[LibTraitRegistry.getFaceIndex(components, petIDs[i])]++;
      handCounts[LibTraitRegistry.getHandIndex(components, petIDs[i])]++;
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
}
