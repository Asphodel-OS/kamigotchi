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
    _createFoodListings(1);
    _createReviveListings(1);
    _setConfig("ACCOUNT_STAMINA_BASE", 1e9);

    // starting states
    _currTime = 5 minutes;
    _idleRequirement = LibConfig.getValueOf(components, "LIQ_IDLE_REQ") + 1;
  }

  /////////////////
  // HELPER FUNCTIONS

  function _createFoodListings(uint merchantIndex) internal {
    uint itemIndex;
    uint[] memory registryIDs = LibRegistryItem.getAllFood(components);
    for (uint i = 0; i < registryIDs.length; i++) {
      itemIndex = LibRegistryItem.getItemIndex(components, registryIDs[i]);
      _listingIDs.push(_setListing(merchantIndex, itemIndex, 10, 10));
    }
  }

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
    for (uint i = 0; i < _listingIDs.length; i++) {
      _buyFromListing(playerIndex, _listingIDs[i], 100);
    }
  }

  // checks whether a production should be liquidatable by a pet
  // assumes the production is active to simulate a health sync
  function _isLiquidatableBy(uint productionID, uint attackerID) internal view returns (bool) {
    uint victimID = LibProduction.getPet(components, productionID);
    uint victimTotalHealth = LibPet.calcTotalHealth(components, victimID);
    uint drainAmt = LibPet.calcProductionDrain(components, victimID);
    uint victimHealth = LibPet.getLastHealth(components, victimID);
    victimHealth = (victimHealth > drainAmt) ? victimHealth - drainAmt : 0;

    uint threshold = LibPet.calcThreshold(components, attackerID, victimID); // 1e18 precision
    return threshold * victimTotalHealth > victimHealth * 1e18;
  }

  // gets the playerIndex of a pet's owner
  function _getOwnerPlayerIndex(uint petID) internal view returns (uint) {
    uint accountID = LibPet.getAccount(components, petID);
    address owner = LibAccount.getOwner(components, accountID);
    for (uint i = 0; i < _owners.length; i++) {
      if (_owners[i] == owner) {
        return i;
      }
    }
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

  // test that the correct account must call the liquidation
  function testMurderPermissionConstraints() public {
    uint numAccounts = 5;
    uint numPets = 5; // number of pets per account
    uint nodeID = _nodeIDs[0];
    uint[] memory victimProductionIDs = _setupDrainedProductions(9, numPets, nodeID);

    // create and stock a bunch of accounts with revives and kamis
    for (uint i = 0; i < numAccounts; i++) {
      _registerAccount(i);
      _petIDs[i] = _mintPets(i, numPets);
    }

    // start harvest on node with other account's kamis, fast forward by idle time requirement
    for (uint i = 0; i < numAccounts; i++) {
      for (uint j = 0; j < numPets; j++) {
        _startProduction(_petIDs[i][j], nodeID);
      }
    }
    _currTime += _idleRequirement;
    vm.warp(_currTime);

    // check that we CANNOT liquidate the starved kamis from the wrong account
    for (uint i = 1; i < numAccounts; i++) {
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

  // test that the player must be in the same room to command liquidations
  function testMurderAccountLocationConstraints() public {
    uint numPets = 5; // number of kamis per account
    uint playerIndex = 0; // the player we're playing with
    uint nodeID = _nodeIDs[0];
    uint[] memory productionIDs = _setupDrainedProductions(9, numPets, nodeID);

    // create acting account and mint its kamis
    _registerAccount(playerIndex);
    _petIDs[playerIndex] = _mintPets(playerIndex, numPets);

    // start harvest on the right Node
    for (uint j = 0; j < numPets; j++) {
      _startProduction(_petIDs[playerIndex][j], nodeID);
    }
    _currTime += _idleRequirement;
    vm.warp(_currTime);

    // move the Account to room 2
    // check that we CANNOT liquidate
    _moveAccount(playerIndex, 2);
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("Node: too far");
      vm.prank(_getOperator(playerIndex));
      _ProductionLiquidateSystem.executeTyped(productionIDs[i], _petIDs[playerIndex][i]);
    }

    // move the Account to room 3
    // check that we CANNOT liquidate
    _moveAccount(playerIndex, 3);
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("Node: too far");
      vm.prank(_getOperator(playerIndex));
      _ProductionLiquidateSystem.executeTyped(productionIDs[i], _petIDs[playerIndex][i]);
    }

    // move the Account to room 1
    // check that we CAN liquidate
    _moveAccount(playerIndex, 1);
    for (uint i = 0; i < numPets; i++) {
      _liquidateProduction(_petIDs[playerIndex][i], productionIDs[i]);
    }
  }

  // test that the pets must be on the same Node to liquidate one another
  function testMurderNodeConstraints() public {
    uint numPets = 5; // number of kamis per account
    uint playerIndex = 0; // the player we're playing with
    uint[] memory victimProductionIDs = _setupDrainedProductions(9, numPets, _nodeIDs[0]);

    // create acting account and mint its kamis
    _registerAccount(playerIndex);
    _petIDs[playerIndex] = _mintPets(playerIndex, numPets);

    // start harvest on wrong Nodes for second account's kamis
    // check that we CANNOT liquidate
    uint location;
    uint[] memory playerProductionIDs = new uint[](numPets);
    for (uint i = 1; i < _nodeIDs.length; i++) {
      location = LibNode.getLocation(components, _nodeIDs[i]);
      if (LibAccount.getLocation(components, _getAccount(playerIndex)) != location) {
        _moveAccount(playerIndex, location);
      }

      for (uint j = 0; j < numPets; j++) {
        playerProductionIDs[j] = _startProduction(_petIDs[playerIndex][j], _nodeIDs[i]);
      }
      _currTime += _idleRequirement;
      vm.warp(_currTime);

      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("Production: must be on same node as target");
        vm.prank(_getOperator(playerIndex));
        _ProductionLiquidateSystem.executeTyped(victimProductionIDs[j], _petIDs[playerIndex][j]);
        _stopProduction(playerProductionIDs[j]);
      }
    }

    // move to the room where Node1 is
    location = LibNode.getLocation(components, _nodeIDs[0]);
    if (LibAccount.getLocation(components, _getAccount(playerIndex)) != location) {
      _moveAccount(playerIndex, location);
    }

    // start harvest on right Node for second account's kamis
    for (uint i = 0; i < numPets; i++) {
      _startProduction(_petIDs[playerIndex][i], _nodeIDs[0]);
    }

    _currTime += _idleRequirement;
    vm.warp(_currTime);

    // check that we CAN liquidate
    for (uint i = 0; i < numPets; i++) {
      _liquidateProduction(_petIDs[playerIndex][i], victimProductionIDs[i]);
    }
  }

  // test that we cannot unless we meet idle requirements
  function testMurderIdleConstraint() public {
    uint numPets = 5; // number of kamis per account
    uint playerIndex = 0; // the player we're playing with
    uint nodeID = _nodeIDs[0];
    uint[] memory victimProductionIDs = _setupDrainedProductions(9, numPets, nodeID);

    // create acting account and mint its kamis
    _registerAccount(playerIndex);
    _petIDs[playerIndex] = _mintPets(playerIndex, numPets);

    // start harvesting on the same node as our victims
    uint[] memory playerProductionIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      playerProductionIDs[i] = _startProduction(_petIDs[playerIndex][i], nodeID);
    }

    // check that we CANNOT liquidate anytime before the idle requirement is met
    uint numIncrements = 5;
    for (uint i = 0; i < numIncrements; i++) {
      _currTime += _idleRequirement / numIncrements;
      vm.warp(_currTime);

      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("Pet: unable to liquidate");
        vm.prank(_getOperator(playerIndex));
        _ProductionLiquidateSystem.executeTyped(victimProductionIDs[j], _petIDs[playerIndex][j]);
      }
    }

    // check that we CAN liquidate after the idle requirement is met
    uint overflow = (_idleRequirement % numIncrements) + 1;
    _currTime += overflow;
    vm.warp(_currTime);
    for (uint i = 0; i < numPets; i++) {
      _liquidateProduction(_petIDs[playerIndex][i], victimProductionIDs[i]);
    }
  }

  // check that pets can only liquidate when both victim and attacker are HARVESTING
  function testMurderStateConstraints() public {
    uint numPets = 5; // number of pets per account
    uint playerIndex = 0; // the player we're playing with
    uint supportPlayerIndex = 1; // the player acting in the background to support test
    uint nodeID = _nodeIDs[0];
    uint[] memory victimProductionIDs = _setupDrainedProductions(9, numPets, nodeID);

    // create acting account and mint its pets
    _registerAccount(playerIndex);
    _stockAccount(playerIndex);
    _petIDs[playerIndex] = _mintPets(playerIndex, numPets);

    // start and stop productions for these pets so they're populated
    uint[] memory playerProductionIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      playerProductionIDs[i] = _startProduction(_petIDs[playerIndex][i], nodeID);
      _stopProduction(playerProductionIDs[i]);
    }
    _currTime += _idleRequirement;
    vm.warp(_currTime);

    // create a supporting account
    _registerAccount(supportPlayerIndex);
    _stockAccount(supportPlayerIndex);
    _petIDs[supportPlayerIndex] = _mintPets(supportPlayerIndex, numPets);

    // check that pets CANNOT liquidate when RESTING
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("Pet: must be harvesting");
      vm.prank(_getOperator(playerIndex));
      _ProductionLiquidateSystem.executeTyped(victimProductionIDs[i], _petIDs[playerIndex][i]);
    }

    // start out player's productions and starve their pets
    for (uint i = 0; i < numPets; i++) {
      _startProduction(_petIDs[playerIndex][i], nodeID);
    }
    _currTime += 100 hours;
    vm.warp(_currTime);

    // check that pets CANNOT liquidate when Starving
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("Pet: starving..");
      vm.prank(_getOperator(playerIndex));
      _ProductionLiquidateSystem.executeTyped(victimProductionIDs[i], _petIDs[playerIndex][i]);
    }

    // kill off our player's pets
    uint[] memory supportProductionIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      supportProductionIDs[i] = _startProduction(_petIDs[supportPlayerIndex][i], nodeID);
      _currTime += _idleRequirement;
      vm.warp(_currTime);
      _liquidateProduction(_petIDs[supportPlayerIndex][i], playerProductionIDs[i]);
    }

    // fast forward as syncHealth resets both pets' last action times during liquidation
    _currTime += _idleRequirement;
    vm.warp(_currTime);

    // check that pets CANNOT liquidate when DEAD
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("Pet: must be harvesting");
      vm.prank(_getOperator(playerIndex));
      _ProductionLiquidateSystem.executeTyped(victimProductionIDs[i], _petIDs[playerIndex][i]);
    }

    // starve out our support player's productions
    _currTime += 100 hours;
    vm.warp(_currTime);

    // revive our pets and start their productions
    for (uint i = 0; i < numPets; i++) {
      _revivePet(_petIDs[playerIndex][i], 1);
      _startProduction(_petIDs[playerIndex][i], nodeID);
    }
    _currTime += _idleRequirement;
    vm.warp(_currTime);

    // check that pets CAN liquidate when HARVESTING
    for (uint i = 0; i < numPets; i++) {
      _liquidateProduction(_petIDs[playerIndex][i], victimProductionIDs[i]);
    }
    _currTime += _idleRequirement;
    vm.warp(_currTime);

    // check that pets CAN can liquidate in succession once idle requirement is met
    for (uint i = 0; i < numPets; i++) {
      _liquidateProduction(_petIDs[playerIndex][i], supportProductionIDs[i]);
    }
  }

  // run a test to ensure that liquidations are only honored at calculated thresholds
  function testMurderThresholdConstraint() public {
    uint numPets = 6; // number of pets per account
    uint numPlayers = 5;

    // create, fund and stock our accounts
    for (uint i = 0; i < numPlayers; i++) {
      _registerAccount(i);
      _stockAccount(i);
      _petIDs[i] = _mintPets(i, numPets);
    }

    // have all players start each pet's production on a random node
    uint nodeID;
    for (uint i = 0; i < numPlayers; i++) {
      for (uint j = 0; j < numPets; j++) {
        nodeID = _nodeIDs[uint(keccak256(abi.encodePacked(i, j))) % _nodeIDs.length];
        _moveAccount(i, LibNode.getLocation(components, nodeID));
        _startProduction(_petIDs[i][j], nodeID);
      }
    }

    // have our players interact in a in a round robin, commanding a single kami to
    // liquidate a random kami that shares a node. whether this succeeds or fails depends
    // on the respective stats of attacker and victim
    uint numIterations = 100;
    uint rand;
    uint playerIndex;
    uint petIndex;
    uint attackerID;
    uint victimID;
    uint productionID;
    uint[] memory productionIDs;
    for (uint i = 0; i < numIterations; i++) {
      rand = uint(keccak256(abi.encodePacked(i)));

      // set the stage
      playerIndex = rand % numPlayers;
      petIndex = rand % numPets;
      attackerID = _petIDs[playerIndex][petIndex];
      nodeID = LibProduction.getNode(components, LibPet.getProduction(components, attackerID));
      productionIDs = LibProduction.getAllOnNode(components, nodeID);
      productionID = productionIDs[rand % productionIDs.length];
      victimID = LibProduction.getPet(components, productionID);

      // fast forward 15-75min
      _currTime += (rand % 1 hours) + 15 minutes;
      vm.warp(_currTime);

      // get the player and pet ready
      _moveAccount(playerIndex, LibNode.getLocation(components, nodeID));
      _feedPet(attackerID, 1);

      // fast forward by idle requirement
      _currTime += _idleRequirement;
      vm.warp(_currTime);

      // if production is liquidatable, liquidate it then revive pet. revert otherwise
      if (!_isLiquidatableBy(productionID, attackerID)) {
        vm.expectRevert("Pet: you lack violence");
        vm.prank(_getOperator(playerIndex));
        _ProductionLiquidateSystem.executeTyped(productionID, attackerID);
      } else {
        // liquidate, revive, heal
        _liquidateProduction(attackerID, productionID);
        _revivePet(victimID, 1);
        _feedPet(victimID, 1);

        // put them on new node
        nodeID = _nodeIDs[rand % _nodeIDs.length];
        _moveAccount(_getOwnerPlayerIndex(victimID), LibNode.getLocation(components, nodeID));
        _startProduction(victimID, nodeID);
      }
    }
  }
}
