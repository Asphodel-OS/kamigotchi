// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "tests/utils/SetupTemplate.t.sol";

contract HarvestTest is SetupTemplate {
  uint256 aKamiID;

  function setUp() public override {
    super.setUp();

    aKamiID = _mintKami(alice);
  }

  function setUpItems() public override {
    _createFood(1, "Gum", "DESCRIPTION", 25, 0, ""); // itemIndex 1
  }

  function testHarvestShape() public {
    uint32 nodeIndex = 1;

    uint256 prodID = _startHarvestByIndex(aKamiID, nodeIndex);
    _fastForward(_idleRequirement + 50);

    _collectHarvest(prodID);
    _fastForward(_idleRequirement + 50);

    _stopHarvest(prodID);
  }

  function testHarvestCollects() public {
    uint32 nodeIndex = 1;
    uint256 expectedTotal;

    uint256 prodID = _startHarvestByIndex(aKamiID, nodeIndex);

    for (uint256 i = 0; i < 10; i++) {
      _fastForward(_idleRequirement + 15 minutes);
      expectedTotal += LibHarvest.calcBounty(components, prodID);
      _collectHarvest(prodID);
      assertEq(LibHarvest.getBalance(components, prodID), 0, "har bal mismatch"); // harvest balance resets upon collect
      assertEq(_getItemBal(alice, 1), expectedTotal, "output bal mismatch"); // total farmed goes to account
    }

    // catching balance in the middle of a sync
    _fastForward(_idleRequirement + 15 minutes);
    assertEq(LibHarvest.getBalance(components, prodID), 0, "pre-sync mismatch");
    uint256 expectedBounty = LibHarvest.calcBounty(components, prodID);
    _sync(prodID);
    expectedTotal += expectedBounty;
    assertEq(LibHarvest.getBalance(components, prodID), expectedBounty, "post-sync mismatch");

    _fastForward(_idleRequirement + 15 minutes);
    expectedTotal += LibHarvest.calcBounty(components, prodID);
    _stopHarvest(prodID);
    assertEq(LibHarvest.getBalance(components, prodID), 0, "post-stop mismatch");
    assertEq(_getItemBal(alice, 1), expectedTotal, "end total mismatch");
  }

  function testHarvestIntensityReset() public {
    uint256 prodID = _startHarvestByIndex(aKamiID, 1);
    _fastForward(_idleRequirement);

    // harvesting for a while, high intensity
    _fastForward(100 hours);
    uint256 intensity = LibHarvest.calcIntensity(components, prodID, aKamiID);
    assertTrue(intensity > 0, "initial intensity mismatch");

    // use item, reset intensity
    _giveItem(alice, 1, 1);
    _feedPet(aKamiID, 1);
    uint256 newIntensity = LibHarvest.calcIntensity(components, prodID, aKamiID);
    assertTrue(intensity > newIntensity, "intensity reset mismatch");
  }

  /////////////////
  // UTILS

  function _sync(uint256 prodID) internal {
    vm.startPrank(deployer);
    LibHarvest.sync(components, prodID);
    vm.stopPrank();
  }
}
//   using LibString for string;
//   using SafeCastLib for int32;
//   using SafeCastLib for uint256;

//   mapping(uint => bool) internal _isStarved;

//   // structure of Node data for test purposes
//   struct TestNodeData {
//     uint32 index;
//     uint32 roomIndex;
//     string name;
//     string description;
//     string affinity;
//   }

//   function setUp() public override {
//     super.setUp();
//   }

//   /////////////////
//   // CALCS

//   function _calcHealthDrain(uint256 output) internal view returns (uint) {
//     return _calcHealthDrain(output, 0);
//   }

//   function _calcHealthDrain(uint256 output, int256 bonus) internal view returns (uint) {
//     uint32[8] memory configVals = LibConfig.getArray(components, "HEALTH_RATE_DRAIN_BASE");
//     uint base = uint256(configVals[0]);
//     uint prec = 10 ** uint256(configVals[1]);
//     uint multiplier = _handlePercentBonus(bonus);
//     return (output * base + (prec / 2)) / prec;
//   }

//   function _calcOutput(uint rate, uint timeDelta) internal view returns (uint) {
//     uint ratePrecision = uint256(LibConfig.getArray(components, "HARVEST_RATE")[0]);
//     return (rate * timeDelta) / 10 ** ratePrecision;
//   }

//   function _calcRate(uint prodID) internal view returns (uint) {
//     // [prec, base, base_prec, mult_prec]
//     uint32[8] memory configs = LibConfig.getArray(components, "HARVEST_RATE");

//     uint256 kamiID = _IdPetComponent.get(prodID);
//     uint256 nodeID = _IdNodeComponent.get(prodID);

//     uint256 precision = 3600;

//     // power
//     uint256 power = _calcPower(kamiID);
//     uint256 P = power;

//     // base rate
//     uint256 ratePrec = 10 ** uint256(configs[0]);
//     uint256 baseRate = uint256(configs[1]);
//     uint256 basePrec = 10 ** uint256(configs[2]);
//     uint256 rfBase = baseRate * ratePrec;
//     precision *= basePrec;

//     // multiplier
//     uint256 multAffinity = _calcAffinityMultiplier(
//       prodID,
//       kamiID,
//       LibBonusOld.getRaw(components, kamiID, "HARVEST_AFFINITY_MULT")
//     );
//     uint256 multBonus = _calcBonusMultiplier(LibBonusOld.getRaw(components, kamiID, "HARVEST_OUTPUT"));
//     uint256 multPrec = 10 ** uint256(configs[3]);
//     uint256 rfMultiplier = multAffinity * multBonus;
//     precision *= multPrec;

//     return (P * rfBase * rfMultiplier) / precision;
//   }

//   // just kami stats for now - may include equipment later
//   function _calcPower(uint kamiID) internal view returns (uint256) {
//     return uint256(uint32(_PowerComponent.calcTotal(kamiID)));
//   }

//   function _calcAffinityMultiplier(uint prodID, uint kamiID) internal view returns (uint) {
//     return _calcAffinityMultiplier(prodID, kamiID, 0);
//   }

//   function _calcAffinityMultiplier(
//     uint prodID,
//     uint kamiID,
//     int256 bonus
//   ) internal view returns (uint) {
//     string memory nodeAff = LibNode.getAffinity(
//       components,
//       LibHarvest.getNode(components, prodID)
//     );
//     string[] memory petAffs = LibKami.getAffinities(components, kamiID);

//     // layer the multipliers due to each trait on top of each other
//     uint256 totMultiplier = 1;
//     for (uint256 i = 0; i < petAffs.length; i++)
//       totMultiplier *= LibAffinity.getMultiplier(
//         LibConfig.getArray(components, "KAMI_HARV_EFFICACY"),
//         bonus,
//         LibAffinity.getHarvestEffectiveness(petAffs[i], nodeAff)
//       );

//     return totMultiplier;
//   }

//   /// @notice returns in raw form - precision is expected to be handled during rate calc
//   function _calcBonusMultiplier(int256 bonus) internal pure returns (uint256) {
//     return _handlePercentBonus(bonus);
//   }

//   /////////////////
//   // SHAPE TESTS

//   // test node creation for expected behaviors
//   function testNodeCreation() public {
//     // test that a node cannot be created by an arbitrary address
//     for (uint32 i = 0; i < 10; i++) {
//       vm.prank(_getOwner(0));
//       vm.expectRevert();
//       __NodeRegistrySystem.executeTyped(i, "HARVESTING", i, "testNode", "", "");

//       vm.prank(_getOperator(0));
//       vm.expectRevert();
//       __NodeRegistrySystem.executeTyped(i, "HARVESTING", i, "testNode", "", "");
//     }

//     // test that a node created by the deployer has the expected fields
//     uint nodeID;
//     uint32 roomIndex;
//     string memory name;
//     string memory description;
//     string memory affinity;
//     for (uint32 i = 0; i < 10; i++) {
//       roomIndex = (i % 3) + 1;
//       name = LibString.concat("testNode", LibString.toString(i));
//       description = LibString.concat("this is a description of the node ", LibString.toString(i));
//       affinity = (i % 2 == 0) ? "INSECT" : "EERIE";
//       nodeID = _createHarvestingNode(i, roomIndex, name, description, affinity);

//       assertEq(LibNode.getByIndex(components, i), nodeID);
//       assertEq(LibNode.getAffinity(components, nodeID), affinity);
//       assertEq(LibNode.getDescription(components, nodeID), description);
//       assertEq(LibNode.getIndex(components, nodeID), i);
//       assertEq(LibNode.getRoom(components, nodeID), roomIndex);
//       assertEq(LibNode.getName(components, nodeID), name);
//       assertEq(LibNode.getType(components, nodeID), "HARVEST");
//     }
//   }

//   function testHarvestCreation() public {
//     // setup
//     uint playerIndex = 0;
//     uint kamiID = _mintKami(playerIndex);
//     uint nodeID = _createHarvestingNode(1, 1, "testNode", "", "NORMAL");

//     // create the harvest
//     _fastForward(_idleRequirement);
//     vm.prank(_getOperator(playerIndex));
//     bytes memory harvestIDFarm20 = _HarvestStartSystem.executeTyped(kamiID, nodeID);
//     uint harvestID = abi.decode(harvestIDFarm20, (uint));

//     // test that a harvest is created with the expected base fields
//     assertEq(LibHarvest.getKami(components, harvestID), kamiID);
//     assertEq(LibHarvest.getNode(components, harvestID), nodeID);
//     assertEq(LibHarvest.getState(components, harvestID), "ACTIVE");

//     // test that the kami's state is updated
//     assertEq(LibKami.getState(components, kamiID), "HARVESTING");
//     assertEq(LibKami.getLastTs(components, kamiID), _currTime);
//   }

//   function testAffinityMultiplier(uint8 nodeSeed, uint8 bodySeed, uint8 handSeed) public {
//     vm.assume(nodeSeed < 5 && bodySeed < 4 && handSeed < 4);
//     string memory nodeAff = _getFuzzAffinity(nodeSeed, true);
//     string memory bodyAff = _getFuzzAffinity(bodySeed, false);
//     string memory handAff = _getFuzzAffinity(handSeed, false);
//     /**
//      * uses prime products to ensure multiplier is added correctly
//      * base: 5, strong: 7, weak: 3
//      * expected:
//      *   pure strong: 49
//      *   pure weak: 9
//      *   strong & weak: 21
//      *   normal: 25
//      *   normal & strong: 35
//      *   normal & weak: 15
//      */

//     // setup
//     _setConfig("KAMI_HARV_EFFICACY", [uint32(5), 7, 3, 0, 0, 0, 0, 0]);
//     uint nodeID = _createHarvestingNode(1, 1, "testNode", "", nodeAff);
//     uint kamiID = _mintKami(0);
//     registerTrait(127, 0, 5, 5, 0, 0, 5, bodyAff, "Test Body", "BODY");
//     registerTrait(127, 0, 5, 5, 0, 0, 5, handAff, "Test Hand", "HAND");
//     _setPetTrait(kamiID, "BODY", 127);
//     _setPetTrait(kamiID, "HAND", 127);

//     uint256 expected;
//     if (nodeAff.eq("NORMAL") || nodeAff.eq("") || bodyAff.eq("NORMAL"))
//       expected = 5; // mid
//     else if (nodeAff.eq(bodyAff))
//       expected = 7; // strong
//     else expected = 3; // weak
//     if (nodeAff.eq("NORMAL") || nodeAff.eq("") || handAff.eq("NORMAL"))
//       expected *= 5; // mid
//     else if (nodeAff.eq(handAff))
//       expected *= 7; // strong
//     else expected *= 3; // weak

//     // start the harvest
//     _fastForward(_idleRequirement);
//     uint prodID = _startHarvest(kamiID, nodeID);

//     // check multiplier
//     assertEq(expected, _calcAffinityMultiplier(prodID, kamiID));
//     assertEq(expected, LibHarvest.calcAffinityMult(components, prodID, kamiID));

//     // add bonus
//     /** add a bonus of 2 to all, therefore expected:
//      *   pure strong: 9 * 9 = 81
//      *   pure weak: 5 * 5 = 25
//      *   strong & weak: 5 * 9 = 45
//      *   normal: 7 * 7 = 49
//      *   normal & strong: 7 * 9 = 63
//      *   normal & weak: 7 * 5 = 35
//      */
//     vm.startPrank(deployer);
//     LibBonusOld.inc(components, kamiID, "HARVEST_AFFINITY_MULT", 2);
//     vm.stopPrank();
//     if (nodeAff.eq("NORMAL") || nodeAff.eq("") || bodyAff.eq("NORMAL"))
//       expected = 7; // mid
//     else if (nodeAff.eq(bodyAff))
//       expected = 9; // strong
//     else expected = 5; // weak
//     if (nodeAff.eq("NORMAL") || nodeAff.eq("") || handAff.eq("NORMAL"))
//       expected *= 7; // mid
//     else if (nodeAff.eq(handAff))
//       expected *= 9; // strong
//     else expected *= 5; // weak

//     assertEq(expected, _calcAffinityMultiplier(prodID, kamiID, 2));
//     assertEq(expected, LibHarvest.calcAffinityMult(components, prodID, kamiID));
//   }

//   /////////////////
//   // CONSTRAINTS TESTS

//   // test that a pet's harvests cannot be started/stopped/collected from by
//   // anyone aside from the owner of the pet
//   function testHarvestAccountConstraints() public {
//     uint numKamis = 5;
//     uint playerIndex = 0; // the player we're playing with
//     uint nodeID = _createHarvestingNode(1, 1, "testNode", "", "NORMAL");

//     // mint some kamis for our player
//     uint[] memory kamiIDs = _mintKamis(playerIndex, numKamis);
//     _fastForward(_idleRequirement);

//     // start the harvests for all kamis, using their account's operator
//     uint[] memory harvestIDs = new uint[](numKamis);
//     for (uint i = 0; i < numKamis; i++) {
//       harvestIDs[i] = _startHarvest(kamiIDs[i], nodeID);
//     }
//     _fastForward(_idleRequirement);

//     // check that other players cannot collect or stop harvests
//     for (uint i = 1; i < 10; i++) {
//       vm.startPrank(_getOperator(i));
//       for (uint j = 0; j < numKamis; j++) {
//         vm.expectRevert("FarmCollect: kami not urs");
//         _HarvestCollectSystem.executeTyped(harvestIDs[j]);

//         vm.expectRevert("FarmStop: kami not urs");
//         _HarvestStopSystem.executeTyped(harvestIDs[j]);
//       }
//       vm.stopPrank();
//     }

//     // check that the owner can collect and stop harvests
//     for (uint i = 0; i < numKamis; i++) {
//       _collectHarvest(harvestIDs[i]);
//       _fastForward(_idleRequirement);
//       _stopHarvest(harvestIDs[i]);
//     }
//     _fastForward(_idleRequirement);

//     // check that other players cannot start harvests
//     for (uint i = 1; i < 10; i++) {
//       vm.startPrank(_getOperator(i));
//       for (uint j = 0; j < numKamis; j++) {
//         vm.expectRevert("FarmStart: kami not urs");
//         _HarvestStartSystem.executeTyped(kamiIDs[j], nodeID);
//       }
//       vm.stopPrank();
//     }
//   }

//   // test roomIndex constraints apply for relevant harvesting functions
//   function testHarvestRoomIndexConstraints() public {
//     uint playerIndex = 0;
//     uint numNodes = 3;
//     uint numKamis = 5;

//     // create nodes
//     uint[] memory nodeIDs = new uint[](3);
//     for (uint32 i = 0; i < numNodes; i++) {
//       nodeIDs[i] = _createHarvestingNode(i + 1, i + 1, "testNode", "", "NORMAL");
//     }

//     // register our player account and mint it some kamis
//     uint[] memory kamiIDs = _mintKamis(playerIndex, numKamis);
//     _fastForward(_idleRequirement);

//     // test that pets can only start a harvest on node in current room, save harvestIDs
//     uint[] memory harvestIDs = new uint[](numKamis);
//     for (uint i = 0; i < numKamis; i++) {
//       vm.expectRevert("FarmStart: node too far");
//       vm.prank(_getOperator(playerIndex));
//       _HarvestStartSystem.executeTyped(kamiIDs[i], nodeIDs[2]);

//       vm.expectRevert("FarmStart: node too far");
//       vm.prank(_getOperator(playerIndex));
//       _HarvestStartSystem.executeTyped(kamiIDs[i], nodeIDs[1]);

//       harvestIDs[i] = _startHarvest(kamiIDs[i], nodeIDs[0]); // roomIndex 1, where account is
//     }
//     _fastForward(_idleRequirement);

//     // test that harvests can be collected from in the same room
//     // NOTE: all harvests at this point are in room 1
//     for (uint i = 0; i < harvestIDs.length; i++) {
//       _collectHarvest(harvestIDs[i]);
//     }
//     _fastForward(_idleRequirement);

//     // move rooms and check that harvest cannot be collected from or stopped
//     _moveAccount(playerIndex, 2);
//     for (uint i = 0; i < harvestIDs.length; i++) {
//       vm.expectRevert("FarmCollect: node too far");
//       vm.prank(_getOperator(playerIndex));
//       _HarvestCollectSystem.executeTyped(harvestIDs[i]);

//       vm.expectRevert("FarmStop: node too far");
//       vm.prank(_getOperator(playerIndex));
//       _HarvestStopSystem.executeTyped(harvestIDs[i]);
//     }

//     // move back to room 1 and stop all harvests
//     _moveAccount(playerIndex, 1);
//     for (uint i = 0; i < harvestIDs.length; i++) {
//       _stopHarvest(harvestIDs[i]);
//     }
//   }

//   // test that harvest operations are properly gated by kami states
//   // TODO: test 'STARVING' pseudo-state
//   function testHarvestStateConstraints() public {
//     // setup
//     uint playerIndex = 0;
//     uint nodeID = _createHarvestingNode(1, 1, "testNode", "", "NORMAL");

//     uint kamiID = _mintKami(playerIndex);
//     _fastForward(_idleRequirement);

//     uint harvestID = _startHarvest(kamiID, nodeID);
//     _fastForward(_idleRequirement);

//     // attempt to start harvest again on current node
//     vm.prank(_getOperator(playerIndex));
//     vm.expectRevert("FarmStart: pet must be resting");
//     _HarvestStartSystem.executeTyped(kamiID, nodeID);

//     // stop harvest..
//     _stopHarvest(harvestID);
//     _fastForward(_idleRequirement);

//     // attempt to stop it again
//     vm.prank(_getOperator(playerIndex));
//     vm.expectRevert("FarmStop: kami must be harvesting");
//     _HarvestStopSystem.executeTyped(productionID);

//     // attempt to collect on stopped harvest
//     vm.prank(_getOperator(playerIndex));
//     vm.expectRevert("FarmCollect: kami must be harvesting");
//     _HarvestCollectSystem.executeTyped(productionID);

//     // loop through start|collect|stop a few times to make sure it still works
//     uint numIterations = 20;
//     for (uint i = 0; i < numIterations; i++) {
//       _startHarvest(kamiID, nodeID);
//       _fastForward(_idleRequirement);
//       _collectHarvest(harvestID);
//       _fastForward(_idleRequirement);
//       _stopHarvest(harvestID);
//       _fastForward(_idleRequirement);
//     }
//   }

//   /////////////////
//   // CALCULATION TESTS

//   // test that harvests yield the correct amount of funds
//   // assume that rate calculations are correct
//   function testHarvestValues(uint seed) public {
//     // setup
//     uint nodeID = _createHarvestingNode(1, 1, "testNode", "", "NORMAL");
//     uint numKamis = (seed % 5) + 1;
//     uint[] memory kamiIDs = _mintKamis(0, numKamis);
//     _fastForward(_idleRequirement);

//     // log the starting health of each kami and start its harvest
//     uint[] memory kamiHealths = new uint[](numKamis);
//     uint[] memory harvestIDs = new uint[](numKamis);
//     for (uint i = 0; i < numKamis; i++) {
//       kamiHealths[i] = uint(int(LibStat.get(components, "HEALTH",  kamiIDs[i]).sync));
//       harvestIDs[i] = _startHarvest(kamiIDs[i], nodeID);
//     }

//     // collect and check that collected amts and kami healths are as expected
//     // kamis can last roughly 5hrs under current configurations
//     // each increment passes time by up to 2 hours
//     uint accountBalance;
//     uint timeDelta;
//     uint rate;
//     uint drain;
//     uint numIterations = 1;
//     for (uint i = 0; i < numIterations; i++) {
//       timeDelta = (uint(keccak256(abi.encodePacked(seed, i))) % 7200) + _idleRequirement;

//       _fastForward(timeDelta);
//       for (uint j = 0; j < numKamis; j++) {
//         if (_isStarved[j]) continue;

//         rate = LibHarvest.getRate(components, harvestIDs[j]);
//         assertEq(rate, _calcRate(harvestIDs[j]));
//         drain = _calcHealthDrain(_calcOutput(rate, timeDelta));

//         if (kamiHealths[j] <= drain) {
//           vm.prank(_getOperator(0));
//           vm.expectRevert("FarmCollect: kami starving..");
//           _HarvestCollectSystem.executeTyped(productionIDs[j]);
//           _isStarved[j] = true;
//         } else {
//           _collectHarvest(harvestIDs[j]);
//           assertEq(
//             uint(int(LibStat.get(components, "HEALTH",  kamiIDs[j]).sync)),
//             kamiHealths[j] - drain
//           );
//           assertEq(
//             LibCoin.get(components, _getAccount(0)),
//             accountBalance + _calcOutput(rate, timeDelta)
//           );

//           kamiHealths[j] -= drain;
//           accountBalance += _calcOutput(rate, timeDelta);
//         }
//       }
//     }
//   }

//   /// @notice tests against a known fixed value - no bonus, no affinity
//   function testFixedCalcBase() public {
//     _setConfig("HARVEST_RATE", [uint32(9), 1000, 3, 9, 0, 0, 0, 0]);
//     uint256 power = 11;
//     uint256 health = 1000;
//     uint256 ratioNumerator = ((10 ** 9) * 1000);
//     uint256 ratioDenominator = ((10 ** 3) * 3600);
//     uint256 timeDelta = 15 minutes;

//     // setup
//     _setConfig("KAMI_STANDARD_COOLDOWN", 0);
//     uint256 nodeID = _createHarvestingNode(1, 1, "testNode", "", "");
//     uint256 kamiID = _mintKami(0);
//     // setting up power and health
//     vm.startPrank(deployer);
//     _PowerComponent.set(kamiID, Stat(power.toInt32(), 0, 0, 0));
//     _HealthComponent.set(kamiID, Stat(health.toInt32(), 0, 0, health.toInt32()));
//     vm.stopPrank();

//     // starting harvest
//     uint prodID = _startHarvest(kamiID, nodeID);
//     _fastForward(timeDelta);

//     // checking calcs
//     uint256 expectedOutput = (power * ratioNumerator * timeDelta) / (ratioDenominator * 10 ** 9);
//     console.log(expectedOutput);
//     assertEq((power * ratioNumerator) / ratioDenominator, _calcRate(prodID), "Rate calc mismatch");
//     assertEq(expectedOutput, _calcOutput(_calcRate(prodID), timeDelta), "Output calc mismatch");
//     _collectHarvest(prodID);
//     assertEq(expectedOutput, LibCoin.get(components, _getAccount(0)), "coin output mismatch");
//   }

//   function testCalcsNoBonus(uint, int32 power, int32 health, uint32 timeDelta) public {
//     vm.assume(power > 0 && power < 2147483); // bounds for int32/1000
//     vm.assume(health > 0 && health < 2147483);

//     // setup
//     _setConfig("KAMI_STANDARD_COOLDOWN", 0);
//     uint256[] memory seeds = _randomUints(3);
//     uint256 nodeID = _createHarvestingNode(1, 1, "testNode", "", _getFuzzAffinity(seeds[0], true));
//     uint256 kamiID = _mintKami(0);
//     // setting up affinity
//     registerTrait(127, 0, 5, 5, 0, 0, 5, _getFuzzAffinity(seeds[1], false), "Test Body", "BODY");
//     registerTrait(127, 0, 5, 5, 0, 0, 5, _getFuzzAffinity(seeds[2], false), "Test Hand", "HAND");
//     _setPetTrait(kamiID, "BODY", 127);
//     _setPetTrait(kamiID, "HAND", 127);
//     // setting up power and health
//     vm.startPrank(deployer);
//     _PowerComponent.set(kamiID, Stat(power, 0, 0, 0));
//     _HealthComponent.set(kamiID, Stat(health, 0, 0, health));
//     vm.stopPrank();

//     // test initial values set accurately
//     assertEq(
//       _getFuzzAffinity(seeds[0], true),
//       LibNode.getAffinity(components, nodeID),
//       "Node affinity mismatch"
//     );
//     assertEq(
//       _getFuzzAffinity(seeds[1], false),
//       LibKami.getAffinities(components, kamiID)[0],
//       "Pet affinity mismatch"
//     );
//     assertEq(
//       _getFuzzAffinity(seeds[2], false),
//       LibKami.getAffinities(components, kamiID)[1],
//       "Pet affinity mismatch"
//     );
//     assertEq(power, _PowerComponent.calcTotal(kamiID), "Power mismatch");
//     assertEq(health, _HealthComponent.calcTotal(kamiID), "Health mismatch");

//     // start harvest
//     uint prodID = _startHarvest(kamiID, nodeID);

//     // checking calcs
//     assertEq(
//       _calcPower(kamiID),
//       uint(int(LibStat.getTotal(components, "POWER", kamiID))),
//       "Power calc mismatch"
//     );
//     assertEq(
//       _calcAffinityMultiplier(prodID, kamiID),
//       LibHarvest.calcAffinityMult(components, prodID, kamiID),
//       "Affinity multiplier calc mismatch"
//     );
//     assertEq(
//       _calcAffinityMultiplier(prodID, kamiID) * _calcBonusMultiplier(0),
//       LibHarvest.calcRateMultiplier(components, prodID),
//       "Multiplier calc mismatch"
//     );
//     assertEq(_calcRate(prodID), LibHarvest.calcRate(components, prodID), "Rate calc mismatch");
//     assertEq(
//       _RateComponent.get(prodID),
//       LibHarvest.calcRate(components, prodID),
//       "Rate set mismatch"
//     );

//     // adjusting based on time
//     _fastForward(timeDelta);

//     // checking time based calcs
//     uint256 rate = _calcRate(prodID);
//     assertEq(timeDelta, LibHarvest.calcDuration(components, prodID), "Duration calc mismatch");
//     assertEq(
//       _calcOutput(rate, timeDelta),
//       LibHarvest.calcBounty(components, prodID),
//       "Output calc mismatch"
//     );
//     assertEq(
//       _calcHealthDrain(_calcOutput(rate, timeDelta)),
//       LibKami.calcStrain(components, kamiID, _calcOutput(rate, timeDelta)),
//       "Health drain calc mismatch"
//     );

//     // collect, check final output and health
//     uint256 drain = _calcHealthDrain(_calcOutput(rate, timeDelta));

//     if (uint(int(health)) <= drain) {
//       vm.prank(_getOperator(0));
//       if (drain >= (1 << 31))
//         vm.expectRevert(SafeCastLib.Overflow.selector); // overflow check
//       else vm.expectRevert("FarmCollect: kami starving..");
//       _HarvestCollectSystem.executeTyped(prodID);
//     } else {
//       _collectHarvest(prodID);
//       assertEq(
//         uint(int(health)) - drain,
//         uint(int(LibStat.get(components, "HEALTH",  kamiID).sync)),
//         "health output mismatch"
//       );
//       assertEq(
//         _calcOutput(rate, timeDelta),
//         LibCoin.get(components, _getAccount(0)),
//         "coin output mismatch"
//       );
//     }
//   }

//   /////////////////
//   // HELPERS

//   function _getFuzzAffinity(uint256 seed, bool canBlank) internal view returns (string memory) {
//     uint256 result = seed % (canBlank ? 5 : 4);
//     if (result == 0) return "INSECT";
//     else if (result == 1) return "EERIE";
//     else if (result == 2) return "SCRAP";
//     else if (result == 3) return "NORMAL";
//     else return "";
//   }

//   /// @notice handles % bonus manipulation (base value of 1000 bps)
//   function _handlePercentBonus(int256 bonus) internal pure returns (uint256) {
//     return bonus > -1000 ? uint256(bonus + 1000) : 1;
//   }

// function _setPetTrait(uint kamiID, string memory trait, uint32 traitIndex) internal {
//   vm.startPrank(deployer);
//   if (trait.eq("BODY")) LibTraitRegistry.setBodyIndex(components, kamiID, traitIndex);
//   else if (trait.eq("HAND")) LibTraitRegistry.setHandIndex(components, kamiID, traitIndex);
//   else if (trait.eq("FACE")) LibTraitRegistry.setFaceIndex(components, kamiID, traitIndex);
//   else if (trait.eq("COLOR")) LibTraitRegistry.setColorIndex(components, kamiID, traitIndex);
//   else if (trait.eq("BACKGROUND"))
//     LibTraitRegistry.setBackgroundIndex(components, kamiID, traitIndex);
//   vm.stopPrank();
// }
// }
