// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";

import "test/utils/SetupTemplate.s.sol";

contract MurderTest is SetupTemplate {
  uint _currTime;
  uint _idleRequirement;
  uint[] internal _listingIDs;
  uint[] internal _nodeIDs;
  mapping(uint => uint[]) internal _petIDs;

  function setUp() public override {
    super.setUp();

    _initTraits();
    _initItems();

    _createRoom("testRoom1", 1, 2, 3, 0);
    _createRoom("testRoom2", 2, 1, 3, 0);
    _createRoom("testRoom3", 3, 1, 2, 0);

    _nodeIDs.push(_createHarvestingNode(1, 1, "Test Node", "this is a node", "NORMAL"));
    _nodeIDs.push(_createHarvestingNode(2, 1, "Test Node", "this is a node", "SCRAP"));
    _nodeIDs.push(_createHarvestingNode(3, 2, "Test Node", "this is a node", "EERIE"));
    _nodeIDs.push(_createHarvestingNode(4, 2, "Test Node", "this is a node", "INSECT"));
    _nodeIDs.push(_createHarvestingNode(5, 3, "Test Node", "this is a node", "NORMAL"));

    _createMerchant(1, 1, "Test Merchant");
    _createReviveListings(1);

    // starting states
    _currTime = 5 minutes;
    _idleRequirement = LibConfig.getValueOf(components, "LIQ_IDLE_REQ") + 1;
  }

  /////////////////
  // HELPER FUNCTIONS

  function _createReviveListings(uint merchantIndex) internal {
    uint itemIndex;
    uint[] memory registryIDs = LibRegistryItem.getAllRevive(components);
    for (uint i = 0; i < registryIDs.length; i++) {
      itemIndex = LibRegistryItem.getItemIndex(components, registryIDs[i]);
      _listingIDs.push(_setListing(merchantIndex, itemIndex, 10, 10));
    }
  }

  // stocks an account with a bunch of revives
  function _stockAccount(uint playerIndex) internal {
    _fundAccount(playerIndex, 1e9);
    _buyFromListing(playerIndex, _listingIDs[0], 100);
  }

  // creates an account and sets up a bunch of drained kamis on the first node with it
  function _setupDrainedProductions(
    uint playerIndex,
    uint numPets,
    uint nodeID
  ) internal returns (uint[] memory) {
    _registerAccount(playerIndex);
    _petIDs[playerIndex] = _mintPets(playerIndex, numPets);

    uint[] memory productionIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      productionIDs[i] = _startProduction(_petIDs[playerIndex][i], nodeID);
    }
    _currTime += 100 hours;
    vm.warp(_currTime);
    return productionIDs;
  }

  /////////////////
  // TESTS

  function testMurderPermissionConstraints() public {
    uint numAccounts = 5;
    uint numPets = 5; // number of pets per account
    uint nodeID = _nodeIDs[0];
    // uint[] memory victimProductionIDs = _setupDrainedProductions(10, numPets, nodeID);

    // create and stock a bunch of accounts with revives and kamis
    for (uint i = 0; i < numAccounts; i++) {
      _registerAccount(i);
      _stockAccount(i);
      _petIDs[i] = _mintPets(i, numPets);
    }

    // start harvest for the last account's kamis on node1
    // drain them completely (so they're ripe for murder)
    uint[] memory victimProductionIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      victimProductionIDs[i] = _startProduction(_petIDs[numAccounts - 1][i], nodeID);
    }
    _currTime += 100 hours;
    vm.warp(_currTime);

    // start harvest on the other accounts on the same node
    for (uint i = 0; i < numAccounts - 1; i++) {
      for (uint j = 0; j < numPets; j++) {
        _startProduction(_petIDs[i][j], nodeID);
      }
    }

    // fast forward by idle time requirement
    _currTime += _idleRequirement;
    vm.warp(_currTime);

    // check that we CANNOT liquidate the starved kamis from the wrong account
    for (uint i = 1; i < numAccounts - 1; i++) {
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("Pet: not urs");
        vm.prank(_getOperator(i));
        _ProductionLiquidateSystem.executeTyped(victimProductionIDs[j], _petIDs[0][j]);
      }
    }

    // check that we CAN liquidate starved kamis from the right account
    for (uint i = 0; i < numPets; i++) {
      _liquidateProduction(_petIDs[0][i], victimProductionIDs[i]);
    }
  }

  function testMurderAccountLocationConstraints() public {
    uint numPets = 5;

    // create and stock two accounts with revives and kamis
    for (uint i = 0; i < 2; i++) {
      _registerAccount(i);
      _stockAccount(i);
      _petIDs[i] = _mintPets(i, numPets);
    }

    // start harvest for first account's kamis on node1 (location 1). drain them
    uint[] memory productionIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      productionIDs[i] = _startProduction(_petIDs[0][i], _nodeIDs[0]);
    }
    _currTime += 100 hours;
    vm.warp(_currTime);

    // start harvest on the right Node
    for (uint j = 0; j < numPets; j++) {
      _startProduction(_petIDs[1][j], _nodeIDs[0]);
    }
    _currTime += _idleRequirement;
    vm.warp(_currTime);

    // move the Account to room 2
    // check that we CANNOT liquidate
    _moveAccount(1, 2);
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("Node: too far");
      vm.prank(_getOperator(1));
      _ProductionLiquidateSystem.executeTyped(productionIDs[i], _petIDs[1][i]);
    }

    // move the Account to room 3
    // check that we CANNOT liquidate
    _moveAccount(1, 3);
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("Node: too far");
      vm.prank(_getOperator(1));
      _ProductionLiquidateSystem.executeTyped(productionIDs[i], _petIDs[1][i]);
    }

    // move the Account to room 1
    // check that we CAN liquidate
    _moveAccount(1, 1);
    for (uint i = 0; i < numPets; i++) {
      _liquidateProduction(_petIDs[1][i], productionIDs[i]);
    }
  }

  function testMurderPetLocationConstraints() public {
    uint numPets = 5;

    // create and stock two of accounts with revives and kamis
    for (uint i = 0; i < 2; i++) {
      _registerAccount(i);
      _stockAccount(i);
      _petIDs[i] = _mintPets(i, numPets);
    }

    // start harvest for first account's kamis on node1 (location 1). drain them
    uint[] memory productionIDs1 = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      productionIDs1[i] = _startProduction(_petIDs[0][i], _nodeIDs[0]);
    }
    _currTime += 100 hours;
    vm.warp(_currTime);

    // start harvest on wrong Nodes for second account's kamis
    // check that we CANNOT liquidate
    uint location;
    uint[] memory productionIDs2 = new uint[](numPets);
    for (uint i = 1; i < _nodeIDs.length; i++) {
      location = LibNode.getLocation(components, _nodeIDs[i]);
      if (LibAccount.getLocation(components, _getAccount(1)) != location) {
        _moveAccount(1, location);
      }

      for (uint j = 0; j < numPets; j++) {
        productionIDs2[j] = _startProduction(_petIDs[1][j], _nodeIDs[i]);
      }
      _currTime += _idleRequirement;
      vm.warp(_currTime);

      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("Production: must be on same node as target");
        vm.prank(_getOperator(1));
        _ProductionLiquidateSystem.executeTyped(productionIDs1[j], _petIDs[1][j]);
        _stopProduction(productionIDs2[j]);
      }
    }

    // move to the room where Node1 is
    location = LibNode.getLocation(components, _nodeIDs[0]);
    if (LibAccount.getLocation(components, _getAccount(1)) != location) {
      _moveAccount(1, location);
    }

    // start harvest on right Node for second account's kamis
    for (uint i = 0; i < numPets; i++) {
      _startProduction(_petIDs[1][i], _nodeIDs[0]);
    }

    _currTime += _idleRequirement;
    vm.warp(_currTime);

    // check that we CAN liquidate
    for (uint i = 0; i < numPets; i++) {
      _liquidateProduction(_petIDs[1][i], productionIDs1[i]);
    }
  }

  function testMurderIdleConstraint() public {}

  // check for both pet state and
  function testMurderStateConstraints() public {}
}
