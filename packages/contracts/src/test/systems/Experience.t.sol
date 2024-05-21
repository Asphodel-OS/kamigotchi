// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract ExperienceTest is SetupTemplate {
  uint _idleRequirement;
  uint internal _nodeID;
  uint internal _numPets;
  uint[] internal _petIDs;
  uint[] internal _experienceLast;

  function setUp() public override {
    super.setUp();

    _nodeID = _createHarvestingNode(1, 1, "Test Node", "this is a node", "NORMAL");
    _idleRequirement = LibConfig.get(components, "KAMI_STANDARD_COOLDOWN");

    _numPets = 5;
    _petIDs = _mintPets(0, _numPets);
    _experienceLast = new uint[](_numPets);
  }

  // test that the experience gained from producing coins is accurate
  // TODO ?: move this to the harvesting test file
  function testExperienceGain() public {
    // start all productions
    _fastForward(_idleRequirement);
    for (uint i = 0; i < _numPets; i++) {
      _startProduction(_petIDs[i], _nodeID);
    }

    // fast forward an hour a number of times and each time check that the resulting
    // experience gain matches the expected, based on how much is collected
    uint accountBalance;
    uint productionID;
    uint collectedCoin;
    uint expectedExpGain;
    uint numLoops = 3;
    for (uint i = 0; i < numLoops; i++) {
      _fastForward(3600);
      for (uint j = 0; j < _numPets; j++) {
        productionID = LibPet.getProduction(components, _petIDs[j]);
        _collectProduction(productionID);
        collectedCoin = _getAccountBalance(0) - accountBalance;
        expectedExpGain = collectedCoin; // may introduce config knob here to determine ratio

        uint currExperience = LibExperience.get(components, _petIDs[j]);
        assertEq(currExperience - _experienceLast[j], expectedExpGain);

        _experienceLast[j] = currExperience;
        accountBalance = _getAccountBalance(0);
      }
    }
  }

  // test that kami components (level, exp, SP) update as expected upon level up
  // NOTE: the leveling curve is hardcoded. there's no clean way to generally test the math
  function testLevelSuccess() public {
    // expected leveling curve, hardcoded with {base: 40, exponent: 1.259)
    uint[] memory levelingCurve = new uint[](12);
    levelingCurve[1] = 40;
    levelingCurve[2] = 50;
    levelingCurve[3] = 63;
    levelingCurve[4] = 79;
    levelingCurve[5] = 100;
    levelingCurve[6] = 126;
    levelingCurve[7] = 159;
    levelingCurve[8] = 200;
    levelingCurve[9] = 252;
    levelingCurve[10] = 317;
    levelingCurve[11] = 400;

    // give all pets a bunch of experience
    vm.startPrank(deployer);
    for (uint i; i < _numPets; i++) {
      LibExperience.set(components, _petIDs[i], 1e9);
    }
    vm.stopPrank();

    // level them up and check that the level cost is as expected
    uint currLevel;
    uint expPoints;
    uint skillPoints;
    uint numLoops;
    vm.startPrank(_getOperator(0));
    while (++numLoops < levelingCurve.length - 1) {
      for (uint i; i < _numPets; i++) {
        currLevel = LibExperience.getLevel(components, _petIDs[i]);
        skillPoints = LibSkill.getPoints(components, _petIDs[i]);
        expPoints = LibExperience.get(components, _petIDs[i]);

        _PetLevelSystem.executeTyped(_petIDs[i]);
        assertEq(LibExperience.getLevel(components, _petIDs[i]), currLevel + 1);
        assertEq(LibSkill.getPoints(components, _petIDs[i]), skillPoints + 1);
        assertEq(LibExperience.get(components, _petIDs[i]), expPoints - levelingCurve[currLevel]);
      }
    }
  }

  // TODO: implement (wrong room, insufficient experience)
  function testLevelFail() public {}
}
