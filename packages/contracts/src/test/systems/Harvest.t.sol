// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";

import "test/utils/SetupTemplate.s.sol";

// TODO: test for correct production rates upon starting harvests
contract HarvestTest is SetupTemplate {
  uint _idleRequirement;
  mapping(uint => bool) internal _isStarved;

  // structure of Node data for test purposes
  struct TestNodeData {
    uint256 index;
    uint256 roomIndex;
    string name;
    string description;
    string affinity;
  }

  function setUp() public override {
    super.setUp();

    _idleRequirement = LibConfig.getValueOf(components, "KAMI_IDLE_REQ");
  }

  /////////////////
  // HELPER FUNCTIONS

  // NOTE: health drain is rounded while reward is truncated
  // this assumes no drain multipliers
  function _getExpectedHealthDrain(uint rate, uint timeDelta) internal view returns (uint) {
    uint ratePrecision = 10 ** LibConfig.getValueOf(components, "HARVEST_RATE_PREC");
    uint output = (rate * timeDelta) / (ratePrecision);
    uint drainBase = LibConfig.getValueOf(components, "HEALTH_RATE_DRAIN_BASE");
    uint drainBasePrecision = 10 ** LibConfig.getValueOf(components, "HEALTH_RATE_DRAIN_BASE_PREC");
    return (output * drainBase + (drainBasePrecision / 2)) / drainBasePrecision;
  }

  function _getExpectedOutput(uint rate, uint timeDelta) internal view returns (uint) {
    uint ratePrecision = LibConfig.getValueOf(components, "HARVEST_RATE_PREC");
    return (rate * timeDelta) / 10 ** ratePrecision;
  }

  /////////////////
  // TESTS

  // test node creation for expected behaviors
  function testNodeCreation() public {
    // test that a node cannot be created by an arbitrary address
    for (uint i = 0; i < 10; i++) {
      vm.prank(_getOwner(0));
      vm.expectRevert();
      __NodeCreateSystem.executeTyped(i, "HARVESTING", i, "testNode", "", "");

      vm.prank(_getOperator(0));
      vm.expectRevert();
      __NodeCreateSystem.executeTyped(i, "HARVESTING", i, "testNode", "", "");
    }

    // test that a node created by the deployer has the expected fields
    uint nodeID;
    uint roomIndex;
    string memory name;
    string memory description;
    string memory affinity;
    for (uint i = 0; i < 10; i++) {
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
    for (uint i = 0; i < numNodes; i++) {
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
      kamiHealths[i] = LibPet.getLastHealth(components, kamiIDs[i]);
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
        drain = _getExpectedHealthDrain(rate, timeDelta);

        if (kamiHealths[j] <= drain) {
          vm.prank(_getOperator(0));
          vm.expectRevert("FarmCollect: pet starving..");
          _ProductionCollectSystem.executeTyped(productionIDs[j]);
          _isStarved[j] = true;
        } else {
          _collectProduction(productionIDs[j]);
          assertEq(LibPet.getLastHealth(components, kamiIDs[j]), kamiHealths[j] - drain);
          assertEq(
            LibCoin.get(components, _getAccount(0)),
            accountBalance + _getExpectedOutput(rate, timeDelta)
          );

          kamiHealths[j] -= drain;
          accountBalance += _getExpectedOutput(rate, timeDelta);
        }
      }
    }
  }
}
