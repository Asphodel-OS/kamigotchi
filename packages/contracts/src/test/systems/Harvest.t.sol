// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";

import "test/utils/SetupTemplate.t.sol";

// TODO: test for correct production rates upon starting harvests
contract HarvestTest is SetupTemplate {
  using SafeCastLib for int32;
  using SafeCastLib for uint256;

  uint _idleRequirement;
  mapping(uint => bool) internal _isStarved;

  // structure of Node data for test purposes
  struct TestNodeData {
    uint32 index;
    uint32 roomIndex;
    string name;
    string description;
    string affinity;
  }

  function setUp() public override {
    super.setUp();

    _idleRequirement = LibConfig.get(components, "KAMI_IDLE_REQ");
  }

  /////////////////
  // CALCS

  function _calcHealthDrain(uint256 output) internal view returns (uint) {
    return _calcHealthDrain(output, 0);
  }

  function _calcHealthDrain(uint256 output, int256 bonus) internal view returns (uint) {
    uint32[8] memory configVals = LibConfig.getArray(components, "HEALTH_RATE_DRAIN_BASE");
    uint base = uint256(configVals[0]);
    uint prec = 10 ** uint256(configVals[1]);
    uint multiplier = _handlePercentBonus(bonus);
    return (output * base + (prec / 2)) / prec;
  }

  function _calcOutput(uint rate, uint timeDelta) internal view returns (uint) {
    uint ratePrecision = uint256(LibConfig.getArray(components, "HARVEST_RATE")[0]);
    return (rate * timeDelta) / 10 ** ratePrecision;
  }

  function _calcRate(uint prodID) internal view returns (uint) {
    // [prec, base, base_prec, mult_prec]
    uint32[8] memory configs = LibConfig.getArray(components, "HARVEST_RATE");

    uint256 petID = _IdPetComponent.get(prodID);
    uint256 nodeID = _IdNodeComponent.get(prodID);

    uint256 precision = 3600;

    // power
    uint256 power = _calcPower(petID);
    uint256 P = power;

    // base rate
    uint256 ratePrec = 10 ** uint256(configs[0]);
    uint256 baseRate = uint256(configs[1]);
    uint256 basePrec = 10 ** uint256(configs[2]);
    uint256 rfBase = baseRate * ratePrec;
    precision *= basePrec;

    // multiplier
    uint256 multAffinity = _calcAffinityMultiplier(
      prodID,
      petID,
      LibBonus.getRaw(components, petID, "HARVEST_AFFINITY_MULT")
    );
    uint256 multBonus = _calcBonusMultiplier(LibBonus.getRaw(components, petID, "HARVEST_OUTPUT"));
    uint256 multPrec = 10 ** uint256(configs[3]);
    uint256 rfMultiplier = multAffinity * multBonus;
    precision *= multPrec;

    return (P * rfBase * rfMultiplier) / precision;
  }

  // just kami stats for now - may include equipment later
  function _calcPower(uint petID) internal view returns (uint256) {
    return uint256(uint32(_PowerComponent.calcTotal(petID)));
  }

  function _calcAffinityMultiplier(uint prodID, uint petID) internal view returns (uint) {
    return _calcAffinityMultiplier(prodID, petID, 0);
  }

  function _calcAffinityMultiplier(
    uint prodID,
    uint petID,
    int256 bonus
  ) internal view returns (uint) {
    string memory nodeAff = LibNode.getAffinity(
      components,
      LibProduction.getNode(components, prodID)
    );
    string[] memory petAffs = LibPet.getAffinities(components, petID);

    // layer the multipliers due to each trait on top of each other
    uint256 totMultiplier = 1;
    for (uint256 i = 0; i < petAffs.length; i++)
      totMultiplier *= LibAffinity.getMultiplier(
        LibConfig.getArray(components, "HARVEST_RATE_MULT_AFF"),
        bonus,
        LibAffinity.getHarvestStrength(components, petAffs[i], nodeAff)
      );

    return totMultiplier;
  }

  /// @notice returns in raw form - precision is expected to be handled during rate calc
  function _calcBonusMultiplier(int256 bonus) internal pure returns (uint256) {
    return _handlePercentBonus(bonus);
  }

  /////////////////
  // SHAPE TESTS

  // test node creation for expected behaviors
  function testNodeCreation() public {
    // test that a node cannot be created by an arbitrary address
    for (uint32 i = 0; i < 10; i++) {
      vm.prank(_getOwner(0));
      vm.expectRevert();
      __NodeCreateSystem.executeTyped(i, "HARVESTING", i, "testNode", "", "");

      vm.prank(_getOperator(0));
      vm.expectRevert();
      __NodeCreateSystem.executeTyped(i, "HARVESTING", i, "testNode", "", "");
    }

    // test that a node created by the deployer has the expected fields
    uint nodeID;
    uint32 roomIndex;
    string memory name;
    string memory description;
    string memory affinity;
    for (uint32 i = 0; i < 10; i++) {
      roomIndex = (i % 3) + 1;
      name = LibString.concat("testNode", LibString.toString(i));
      description = LibString.concat("this is a description of the node ", LibString.toString(i));
      affinity = (i % 2 == 0) ? "INSECT" : "EERIE";
      nodeID = _createHarvestingNode(i, roomIndex, name, description, affinity);

      assertEq(LibNode.getByIndex(components, i), nodeID);
      assertEq(LibNode.getAffinity(components, nodeID), affinity);
      assertEq(LibNode.getDescription(components, nodeID), description);
      assertEq(LibNode.getIndex(components, nodeID), i);
      assertEq(LibNode.getRoom(components, nodeID), roomIndex);
      assertEq(LibNode.getName(components, nodeID), name);
      assertEq(LibNode.getType(components, nodeID), "HARVEST");
    }
  }

  function testProductionCreation() public {
    // setup
    uint playerIndex = 0;
    uint kamiID = _mintPet(playerIndex);
    uint nodeID = _createHarvestingNode(1, 1, "testNode", "", "NORMAL");

    // create the production
    _fastForward(_idleRequirement);
    vm.prank(_getOperator(playerIndex));
    bytes memory productionIDFarm20 = _ProductionStartSystem.executeTyped(kamiID, nodeID);
    uint productionID = abi.decode(productionIDFarm20, (uint));

    // test that a production is created with the expected base fields
    assertEq(LibProduction.getPet(components, productionID), kamiID);
    assertEq(LibProduction.getNode(components, productionID), nodeID);
    assertEq(LibProduction.getState(components, productionID), "ACTIVE");

    // test that the kami's state is updated
    assertEq(LibPet.getState(components, kamiID), "HARVESTING");
    assertEq(LibPet.getLastTs(components, kamiID), _currTime);
  }

  /////////////////
  // CONSTRAINTS TESTS

  // test that a pet's productions cannot be started/stopped/collected from by
  // anyone aside from the owner of the pet
  function testProductionAccountConstraints() public {
    uint numKamis = 5;
    uint playerIndex = 0; // the player we're playing with
    uint nodeID = _createHarvestingNode(1, 1, "testNode", "", "NORMAL");

    // mint some kamis for our player
    uint[] memory kamiIDs = _mintPets(playerIndex, numKamis);
    _fastForward(_idleRequirement);

    // start the productions for all kamis, using their account's operator
    uint[] memory productionIDs = new uint[](numKamis);
    for (uint i = 0; i < numKamis; i++) {
      productionIDs[i] = _startProduction(kamiIDs[i], nodeID);
    }
    _fastForward(_idleRequirement);

    // check that other players cannot collect or stop productions
    for (uint i = 1; i < 10; i++) {
      vm.startPrank(_getOperator(i));
      for (uint j = 0; j < numKamis; j++) {
        vm.expectRevert("FarmCollect: pet not urs");
        _ProductionCollectSystem.executeTyped(productionIDs[j]);

        vm.expectRevert("FarmStop: pet not urs");
        _ProductionStopSystem.executeTyped(productionIDs[j]);
      }
      vm.stopPrank();
    }

    // check that the owner can collect and stop productions
    for (uint i = 0; i < numKamis; i++) {
      _collectProduction(productionIDs[i]);
      _fastForward(_idleRequirement);
      _stopProduction(productionIDs[i]);
    }
    _fastForward(_idleRequirement);

    // check that other players cannot start productions
    for (uint i = 1; i < 10; i++) {
      vm.startPrank(_getOperator(i));
      for (uint j = 0; j < numKamis; j++) {
        vm.expectRevert("FarmStart: pet not urs");
        _ProductionStartSystem.executeTyped(kamiIDs[j], nodeID);
      }
      vm.stopPrank();
    }
  }

  // test roomIndex constraints apply for relevant harvesting functions
  function testProductionRoomIndexConstraints() public {
    uint playerIndex = 0;
    uint numNodes = 3;
    uint numKamis = 5;

    // create nodes
    uint[] memory nodeIDs = new uint[](3);
    for (uint32 i = 0; i < numNodes; i++) {
      nodeIDs[i] = _createHarvestingNode(i + 1, i + 1, "testNode", "", "NORMAL");
    }

    // register our player account and mint it some kamis
    uint[] memory kamiIDs = _mintPets(playerIndex, numKamis);
    _fastForward(_idleRequirement);

    // test that pets can only start a production on node in current room, save productionIDs
    uint[] memory productionIDs = new uint[](numKamis);
    for (uint i = 0; i < numKamis; i++) {
      vm.expectRevert("FarmStart: node too far");
      vm.prank(_getOperator(playerIndex));
      _ProductionStartSystem.executeTyped(kamiIDs[i], nodeIDs[2]);

      vm.expectRevert("FarmStart: node too far");
      vm.prank(_getOperator(playerIndex));
      _ProductionStartSystem.executeTyped(kamiIDs[i], nodeIDs[1]);

      productionIDs[i] = _startProduction(kamiIDs[i], nodeIDs[0]); // roomIndex 1, where account is
    }
    _fastForward(_idleRequirement);

    // test that productions can be collected from in the same room
    // NOTE: all productions at this point are in room 1
    for (uint i = 0; i < productionIDs.length; i++) {
      _collectProduction(productionIDs[i]);
    }
    _fastForward(_idleRequirement);

    // move rooms and check that production cannot be collected from or stopped
    _moveAccount(playerIndex, 2);
    for (uint i = 0; i < productionIDs.length; i++) {
      vm.expectRevert("FarmCollect: node too far");
      vm.prank(_getOperator(playerIndex));
      _ProductionCollectSystem.executeTyped(productionIDs[i]);

      vm.expectRevert("FarmStop: node too far");
      vm.prank(_getOperator(playerIndex));
      _ProductionStopSystem.executeTyped(productionIDs[i]);
    }

    // move back to room 1 and stop all productions
    _moveAccount(playerIndex, 1);
    for (uint i = 0; i < productionIDs.length; i++) {
      _stopProduction(productionIDs[i]);
    }
  }

  // test that production operations are properly gated by kami states
  // TODO: test 'STARVING' pseudo-state
  function testProductionStateConstraints() public {
    // setup
    uint playerIndex = 0;
    uint nodeID = _createHarvestingNode(1, 1, "testNode", "", "NORMAL");

    uint kamiID = _mintPet(playerIndex);
    _fastForward(_idleRequirement);

    uint productionID = _startProduction(kamiID, nodeID);
    _fastForward(_idleRequirement);

    // attempt to start production again on current node
    vm.prank(_getOperator(playerIndex));
    vm.expectRevert("FarmStart: pet must be resting");
    _ProductionStartSystem.executeTyped(kamiID, nodeID);

    // stop production..
    _stopProduction(productionID);
    _fastForward(_idleRequirement);

    // attempt to stop it again
    vm.prank(_getOperator(playerIndex));
    vm.expectRevert("FarmStop: pet must be harvesting");
    _ProductionStopSystem.executeTyped(productionID);

    // attempt to collect on stopped production
    vm.prank(_getOperator(playerIndex));
    vm.expectRevert("FarmCollect: pet must be harvesting");
    _ProductionCollectSystem.executeTyped(productionID);

    // loop through start|collect|stop a few times to make sure it still works
    uint numIterations = 20;
    for (uint i = 0; i < numIterations; i++) {
      _startProduction(kamiID, nodeID);
      _fastForward(_idleRequirement);
      _collectProduction(productionID);
      _fastForward(_idleRequirement);
      _stopProduction(productionID);
      _fastForward(_idleRequirement);
    }
  }

  /////////////////
  // CALCULATION TESTS

  // test that productions yield the correct amount of funds
  // assume that rate calculations are correct
  function testProductionValues(uint seed) public {
    // setup
    uint nodeID = _createHarvestingNode(1, 1, "testNode", "", "NORMAL");
    uint numKamis = (seed % 5) + 1;
    uint[] memory kamiIDs = _mintPets(0, numKamis);
    _fastForward(_idleRequirement);

    // log the starting health of each kami and start its production
    uint[] memory kamiHealths = new uint[](numKamis);
    uint[] memory productionIDs = new uint[](numKamis);
    for (uint i = 0; i < numKamis; i++) {
      kamiHealths[i] = uint(int(LibStat.getHealth(components, kamiIDs[i]).sync));
      productionIDs[i] = _startProduction(kamiIDs[i], nodeID);
    }

    // collect and check that collected amts and kami healths are as expected
    // kamis can last roughly 5hrs under current configurations
    // each increment passes time by up to 2 hours
    uint accountBalance;
    uint timeDelta;
    uint rate;
    uint drain;
    uint numIterations = 1;
    for (uint i = 0; i < numIterations; i++) {
      timeDelta = (uint(keccak256(abi.encodePacked(seed, i))) % 7200) + _idleRequirement;

      _fastForward(timeDelta);
      for (uint j = 0; j < numKamis; j++) {
        if (_isStarved[j]) continue;

        rate = LibProduction.getRate(components, productionIDs[j]);
        assertEq(rate, _calcRate(productionIDs[j]));
        drain = _calcHealthDrain(_calcOutput(rate, timeDelta));

        if (kamiHealths[j] <= drain) {
          vm.prank(_getOperator(0));
          vm.expectRevert("FarmCollect: pet starving..");
          _ProductionCollectSystem.executeTyped(productionIDs[j]);
          _isStarved[j] = true;
        } else {
          _collectProduction(productionIDs[j]);
          assertEq(
            uint(int(LibStat.getHealth(components, kamiIDs[j]).sync)),
            kamiHealths[j] - drain
          );
          assertEq(
            LibCoin.get(components, _getAccount(0)),
            accountBalance + _calcOutput(rate, timeDelta)
          );

          kamiHealths[j] -= drain;
          accountBalance += _calcOutput(rate, timeDelta);
        }
      }
    }
  }

  /// @notice tests against a known fixed value - no bonus, no affinity
  function testFixedCalcBase() public {
    _setConfigArray("HARVEST_RATE", [uint32(9), 1000, 3, 9, 0, 0, 0, 0]);
    uint256 power = 11;
    uint256 health = 1000;
    uint256 ratioNumerator = ((10 ** 9) * 1000);
    uint256 ratioDenominator = ((10 ** 3) * 3600);
    uint256 timeDelta = 15 minutes;

    // setup
    _setConfig("KAMI_IDLE_REQ", 0);
    uint256 nodeID = _createHarvestingNode(1, 1, "testNode", "", "");
    uint256 petID = _mintPet(0);
    // setting up power and health
    vm.startPrank(deployer);
    _PowerComponent.set(petID, Stat(power.toInt32(), 0, 0, 0));
    _HealthComponent.set(petID, Stat(health.toInt32(), 0, 0, health.toInt32()));
    vm.stopPrank();

    // starting production
    uint prodID = _startProduction(petID, nodeID);
    _fastForward(timeDelta);

    // checking calcs
    uint256 expectedOutput = (power * ratioNumerator * timeDelta) / (ratioDenominator * 10 ** 9);
    console.log(expectedOutput);
    assertEq((power * ratioNumerator) / ratioDenominator, _calcRate(prodID), "Rate calc mismatch");
    assertEq(expectedOutput, _calcOutput(_calcRate(prodID), timeDelta), "Output calc mismatch");
    _collectProduction(prodID);
    assertEq(expectedOutput, LibCoin.get(components, _getAccount(0)), "coin output mismatch");
  }

  function testCalcsNoBonus(uint, int32 power, int32 health, uint32 timeDelta) public {
    vm.assume(power > 0 && power < 2147483); // bounds for int32/1000
    vm.assume(health > 0 && health < 2147483);

    // setup
    _setConfig("KAMI_IDLE_REQ", 0);
    uint256[] memory seeds = _randomUints(3);
    uint256 nodeID = _createHarvestingNode(1, 1, "testNode", "", _getFuzzAffinity(seeds[0], true));
    uint256 petID = _mintPet(0);
    // setting up affinity
    registerTrait(127, 0, 5, 5, 0, 0, 5, _getFuzzAffinity(seeds[1], false), "Test Body", "BODY");
    registerTrait(127, 0, 5, 5, 0, 0, 5, _getFuzzAffinity(seeds[2], false), "Test Hand", "HAND");
    _setPetTrait(petID, "BODY", 127);
    _setPetTrait(petID, "HAND", 127);
    // setting up power and health
    vm.startPrank(deployer);
    _PowerComponent.set(petID, Stat(power, 0, 0, 0));
    _HealthComponent.set(petID, Stat(health, 0, 0, health));
    vm.stopPrank();

    // test initial values set accurately
    assertEq(
      _getFuzzAffinity(seeds[0], true),
      LibNode.getAffinity(components, nodeID),
      "Node affinity mismatch"
    );
    assertEq(
      _getFuzzAffinity(seeds[1], false),
      LibPet.getAffinities(components, petID)[0],
      "Pet affinity mismatch"
    );
    assertEq(
      _getFuzzAffinity(seeds[2], false),
      LibPet.getAffinities(components, petID)[1],
      "Pet affinity mismatch"
    );
    assertEq(power, _PowerComponent.calcTotal(petID), "Power mismatch");
    assertEq(health, _HealthComponent.calcTotal(petID), "Health mismatch");

    // start production
    uint prodID = _startProduction(petID, nodeID);

    // checking calcs
    assertEq(
      _calcPower(petID),
      uint(int(LibPet.calcTotalPower(components, petID))),
      "Power calc mismatch"
    );
    assertEq(
      _calcAffinityMultiplier(prodID, petID),
      LibProduction.calcRateAffinityMultiplier(components, prodID, petID),
      "Affinity multiplier calc mismatch"
    );
    assertEq(
      _calcAffinityMultiplier(prodID, petID) * _calcBonusMultiplier(0),
      LibProduction.calcRateMultiplier(components, prodID),
      "Multiplier calc mismatch"
    );
    assertEq(_calcRate(prodID), LibProduction.calcRate(components, prodID), "Rate calc mismatch");
    assertEq(
      _RateComponent.get(prodID),
      LibProduction.calcRate(components, prodID),
      "Rate set mismatch"
    );

    // adjusting based on time
    _fastForward(timeDelta);

    // checking time based calcs
    uint256 rate = _calcRate(prodID);
    assertEq(timeDelta, LibProduction.calcDuration(components, prodID), "Duration calc mismatch");
    assertEq(
      _calcOutput(rate, timeDelta),
      LibProduction.calcOutput(components, prodID),
      "Output calc mismatch"
    );
    assertEq(
      _calcHealthDrain(_calcOutput(rate, timeDelta)),
      LibPet.calcDrain(components, petID, _calcOutput(rate, timeDelta)),
      "Health drain calc mismatch"
    );

    // collect, check final output and health
    uint256 drain = _calcHealthDrain(_calcOutput(rate, timeDelta));

    if (uint(int(health)) <= drain) {
      vm.prank(_getOperator(0));
      if (drain >= (1 << 31))
        vm.expectRevert(SafeCastLib.Overflow.selector); // overflow check
      else vm.expectRevert("FarmCollect: pet starving..");
      _ProductionCollectSystem.executeTyped(prodID);
    } else {
      _collectProduction(prodID);
      assertEq(
        uint(int(health)) - drain,
        uint(int(LibStat.getHealth(components, petID).sync)),
        "health output mismatch"
      );
      assertEq(
        _calcOutput(rate, timeDelta),
        LibCoin.get(components, _getAccount(0)),
        "coin output mismatch"
      );
    }
  }

  /////////////////
  // HELPERS

  function _getFuzzAffinity(uint256 seed, bool canBlank) internal view returns (string memory) {
    uint256 result = seed % (canBlank ? 5 : 4);
    if (result == 0) return "INSECT";
    else if (result == 1) return "EERIE";
    else if (result == 2) return "SCRAP";
    else if (result == 3) return "NORMAL";
    else return "";
  }

  /// @notice handles % bonus manipulation (base value of 1000 bps)
  function _handlePercentBonus(int256 bonus) internal pure returns (uint256) {
    return bonus > -1000 ? uint256(bonus + 1000) : 1;
  }
}
