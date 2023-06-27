// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";

import "test/utils/SetupTemplate.s.sol";

contract HarvestTest is SetupTemplate {
  // structure of Merchant data for test purposes
  struct TestNodeData {
    uint256 index;
    uint256 location;
    string name;
    string description;
    string affinity;
  }

  function setUp() public override {
    super.setUp();

    // create rooms
    _createRoom("testRoom1", 1, 2, 3, 0);
    _createRoom("testRoom2", 2, 1, 3, 0);
    _createRoom("testRoom3", 3, 1, 2, 0);

    _initTraits();
  }

  /////////////////
  // HELPER FUNCTIONS
  function _startProduction(uint kamiID, uint nodeID) internal returns (uint) {
    uint accountID = LibPet.getAccount(components, kamiID);
    address operator = LibAccount.getOperator(components, accountID);

    vm.prank(operator);
    bytes memory productionID = _ProductionStartSystem.executeTyped(kamiID, nodeID);
    return abi.decode(productionID, (uint));
  }

  function _stopProduction(uint productionID) internal {
    uint kamiID = LibProduction.getPet(components, productionID);
    uint accountID = LibPet.getAccount(components, kamiID);
    address operator = LibAccount.getOperator(components, accountID);

    vm.prank(operator);
    _ProductionStopSystem.executeTyped(productionID);
  }

  function _collectProduction(uint productionID) internal {
    uint kamiID = LibProduction.getPet(components, productionID);
    uint accountID = LibPet.getAccount(components, kamiID);
    address operator = LibAccount.getOperator(components, accountID);

    vm.prank(operator);
    _ProductionCollectSystem.executeTyped(productionID);
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
    uint location;
    string memory name;
    string memory description;
    string memory affinity;
    for (uint i = 0; i < 10; i++) {
      location = (i % 3) + 1;
      name = LibString.concat("testNode", LibString.toString(i));
      description = LibString.concat("this is a description of the node ", LibString.toString(i));
      affinity = (i % 2 == 0) ? "INSECT" : "EERIE";
      nodeID = _createHarvestingNode(i, location, name, description, affinity);

      assertEq(LibNode.getByIndex(components, i), nodeID);
      assertEq(LibNode.getAffinity(components, nodeID), affinity);
      assertEq(LibNode.getDescription(components, nodeID), description);
      assertEq(LibNode.getIndex(components, nodeID), i);
      assertEq(LibNode.getLocation(components, nodeID), location);
      assertEq(LibNode.getName(components, nodeID), name);
      assertEq(LibNode.getType(components, nodeID), "HARVEST");
    }
  }

  // test that a pet's productions cannot be started/stopped/collected from by
  // anyone aside from the owner of the pet
  function testProductionAccountConstraints() public {
    // register player accounts (all start in room 1)
    for (uint i = 0; i < 10; i++) {
      _registerAccount(i);
    }

    // mint some kamis for the player 0
    uint numKamis = 5;
    _mintPets(0, numKamis);
    uint[] memory kamiIDs = LibPet.getAllForAccount(components, _getAccount(0));

    // create node in room 1
    uint nodeID = _createHarvestingNode(1, 1, "testNode", "", "NORMAL");

    // start the productions for all kamis, using their account's operator
    uint[] memory productionIDs = new uint[](numKamis);
    for (uint i = 0; i < numKamis; i++) {
      productionIDs[i] = _startProduction(kamiIDs[i], nodeID);
    }

    // check that other players cannot collect or stop productions
    for (uint i = 1; i < 10; i++) {
      vm.startPrank(_getOperator(i));
      for (uint j = 0; j < numKamis; j++) {
        vm.expectRevert("Pet: not urs");
        _ProductionCollectSystem.executeTyped(productionIDs[j]);

        vm.expectRevert("Pet: not urs");
        _ProductionStopSystem.executeTyped(productionIDs[j]);
      }
      vm.stopPrank();
    }

    // check that the owner can collect and stop productions
    for (uint i = 0; i < numKamis; i++) {
      _collectProduction(productionIDs[i]);
      _stopProduction(productionIDs[i]);
    }

    // check that other players cannot start productions
    for (uint i = 1; i < 10; i++) {
      vm.startPrank(_getOperator(i));
      for (uint j = 0; j < numKamis; j++) {
        vm.expectRevert("Pet: not urs");
        _ProductionStartSystem.executeTyped(kamiIDs[j], nodeID);
      }
      vm.stopPrank();
    }
  }

  // test location constraints apply for relevant harvesting functions
  function testProductionLocationConstraints() public {
    uint playerIndex = 0;
    uint numNodes = 3;
    uint numKamis = 5;

    // create nodes
    uint[] memory nodeIDs = new uint[](3);
    for (uint i = 0; i < numNodes; i++) {
      nodeIDs[i] = _createHarvestingNode(i + 1, i + 1, "testNode", "", "NORMAL");
    }

    // register our player account and mint it some kamis
    _registerAccount(playerIndex);
    _mintPets(playerIndex, numKamis);
    uint[] memory kamiIDs = LibPet.getAllForAccount(components, _getAccount(playerIndex));

    // test that pets can only start a production on node in current room, save productionIDs
    uint[] memory productionIDs = new uint[](numKamis);
    for (uint i = 0; i < numKamis; i++) {
      vm.expectRevert("Node: too far");
      vm.prank(_getOperator(playerIndex));
      _ProductionStartSystem.executeTyped(kamiIDs[i], nodeIDs[2]);

      vm.expectRevert("Node: too far");
      vm.prank(_getOperator(playerIndex));
      _ProductionStartSystem.executeTyped(kamiIDs[i], nodeIDs[1]);

      productionIDs[i] = _startProduction(kamiIDs[i], nodeIDs[0]); // location 1, where account is
    }

    // test that productions can be collected from in the same room
    // NOTE: all productions at this point are in room 1
    for (uint i = 0; i < productionIDs.length; i++) {
      _collectProduction(productionIDs[i]);
    }

    // move rooms and check that production cannot be collected from or stopped
    _moveAccount(playerIndex, 2);
    for (uint i = 0; i < productionIDs.length; i++) {
      vm.expectRevert("Node: too far");
      vm.prank(_getOperator(playerIndex));
      _ProductionCollectSystem.executeTyped(productionIDs[i]);

      vm.expectRevert("Node: too far");
      vm.prank(_getOperator(playerIndex));
      _ProductionStopSystem.executeTyped(productionIDs[i]);
    }

    // move back to room 1 and stop all productions
    _moveAccount(playerIndex, 1);
    for (uint i = 0; i < productionIDs.length; i++) {
      _stopProduction(productionIDs[i]);
    }
  }

  function testProductionStates() public {}

  function testProductionAmounts() public {}
}
