// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract MurderTest is SetupTemplate {
  uint _idleRequirement;
  uint[] internal _listingIDs;
  uint[] internal _nodeIDs;
  mapping(uint => uint[]) internal _petIDs;

  function setUp() public override {
    super.setUp();

    _setConfig("ACCOUNT_STAMINA_BASE", 1e9);

    _createNPC(1, 1, "Test NPC");
    _createFoodListings(1);
    _createReviveListings(1);

    _nodeIDs.push(_createHarvestingNode(1, 1, "Test Node", "this is a node", "NORMAL"));
    _nodeIDs.push(_createHarvestingNode(2, 1, "Test Node", "this is a node", "SCRAP"));
    _nodeIDs.push(_createHarvestingNode(3, 2, "Test Node", "this is a node", "EERIE"));
    _nodeIDs.push(_createHarvestingNode(4, 2, "Test Node", "this is a node", "INSECT"));
    _nodeIDs.push(_createHarvestingNode(5, 3, "Test Node", "this is a node", "NORMAL"));

    // starting states
    _idleRequirement = LibConfig.getValueOf(components, "KAMI_IDLE_REQ");
  }

  /////////////////
  // HELPER FUNCTIONS

  function _createFoodListings(uint32 npcIndex) internal {
    uint32 itemIndex;
    uint[] memory registryIDs = LibRegistryItem.getAllFood(components);
    for (uint i = 0; i < registryIDs.length; i++) {
      itemIndex = LibRegistryItem.getIndex(components, registryIDs[i]);
      _listingIDs.push(_setListing(npcIndex, itemIndex, 10, 10));
    }
  }

  function _createReviveListings(uint32 npcIndex) internal {
    uint32 itemIndex;
    uint[] memory registryIDs = LibRegistryItem.getAllRevive(components);
    for (uint i = 0; i < registryIDs.length; i++) {
      itemIndex = LibRegistryItem.getIndex(components, registryIDs[i]);
      _listingIDs.push(_setListing(npcIndex, itemIndex, 10, 10));
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
    uint totalHealth = LibPet.calcTotalHealth(components, victimID);
    uint output = LibProduction.calcOutput(components, productionID);
    uint drain = LibPet.calcDrain(components, victimID, output);
    uint health = LibPet.getLastHealth(components, victimID);
    health = (health > drain) ? health - drain : 0;

    uint threshold = LibPet.calcThreshold(components, attackerID, victimID); // 1e18 precision
    return threshold * totalHealth > health * 1e18;
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
    _petIDs[playerIndex] = _mintPets(playerIndex, numPets);
    _fastForward(_idleRequirement);

    uint[] memory productionIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      productionIDs[i] = _startProduction(_petIDs[playerIndex][i], nodeID);
    }
    _fastForward(100 hours);
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
      _petIDs[i] = _mintPets(i, numPets);
    }
    _fastForward(_idleRequirement);

    // start harvest on node with other account's kamis, fast forward by idle time requirement
    for (uint i = 0; i < numAccounts; i++) {
      for (uint j = 0; j < numPets; j++) {
        _startProduction(_petIDs[i][j], nodeID);
      }
    }
    _fastForward(_idleRequirement);

    // check that we CANNOT liquidate the starved kamis from the wrong account
    for (uint i = 1; i < numAccounts; i++) {
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("FarmLiquidate: pet not urs");
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
  function testMurderAccountRoomIndexConstraints() public {
    uint numPets = 5; // number of kamis per account
    uint playerIndex = 0; // the player we're playing with
    uint nodeID = _nodeIDs[0];
    uint[] memory productionIDs = _setupDrainedProductions(9, numPets, nodeID);

    // create acting account and mint its kamis
    _petIDs[playerIndex] = _mintPets(playerIndex, numPets);
    _fastForward(_idleRequirement);

    // start harvest on the right Node
    for (uint j = 0; j < numPets; j++) {
      _startProduction(_petIDs[playerIndex][j], nodeID);
    }
    _fastForward(_idleRequirement);

    // move the Account to room 2
    // check that we CANNOT liquidate
    _moveAccount(playerIndex, 2);
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("FarmLiquidate: node too far");
      vm.prank(_getOperator(playerIndex));
      _ProductionLiquidateSystem.executeTyped(productionIDs[i], _petIDs[playerIndex][i]);
    }

    // move the Account to room 3
    // check that we CANNOT liquidate
    _moveAccount(playerIndex, 3);
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("FarmLiquidate: node too far");
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
    _petIDs[playerIndex] = _mintPets(playerIndex, numPets);
    _fastForward(_idleRequirement);

    // confirm we CANNOT liquidate from the wrong nodes
    uint32 roomIndex;
    uint[] memory playerProductionIDs = new uint[](numPets);
    for (uint i = 1; i < _nodeIDs.length; i++) {
      // move to the room where the Node is
      roomIndex = LibNode.getRoom(components, _nodeIDs[i]);
      if (LibAccount.getRoom(components, _getAccount(playerIndex)) != roomIndex) {
        _moveAccount(playerIndex, roomIndex);
      }

      // start productions for all pets
      for (uint j = 0; j < numPets; j++) {
        playerProductionIDs[j] = _startProduction(_petIDs[playerIndex][j], _nodeIDs[i]);
      }
      _fastForward(_idleRequirement);

      // attempt to liquidate, then stop production
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("FarmLiquidate: target too far");
        vm.prank(_getOperator(playerIndex));
        _ProductionLiquidateSystem.executeTyped(victimProductionIDs[j], _petIDs[playerIndex][j]);
        _stopProduction(playerProductionIDs[j]);
      }
      _fastForward(_idleRequirement);
    }

    // move to the room where Node1 is
    roomIndex = LibNode.getRoom(components, _nodeIDs[0]);
    if (LibAccount.getRoom(components, _getAccount(playerIndex)) != roomIndex) {
      _moveAccount(playerIndex, roomIndex);
    }

    // start harvest on right Node for second account's kamis
    for (uint i = 0; i < numPets; i++) {
      _startProduction(_petIDs[playerIndex][i], _nodeIDs[0]);
    }
    _fastForward(_idleRequirement);

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
    _fastForward(_idleRequirement);

    // create acting account and mint its kamis
    _petIDs[playerIndex] = _mintPets(playerIndex, numPets);
    _fastForward(_idleRequirement);

    // start harvesting on the same node as our victims
    uint[] memory playerProductionIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      playerProductionIDs[i] = _startProduction(_petIDs[playerIndex][i], nodeID);
    }

    // check that we CANNOT liquidate anytime before the idle requirement is met
    uint numIncrements = 7; // KAMI_IDLE_REQ must not be divisible by this number
    for (uint i = 0; i < numIncrements; i++) {
      _fastForward(_idleRequirement / numIncrements);

      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("FarmLiquidate: pet on cooldown");
        vm.prank(_getOperator(playerIndex));
        _ProductionLiquidateSystem.executeTyped(victimProductionIDs[j], _petIDs[playerIndex][j]);
      }
    }

    // check that we CAN liquidate after the idle requirement is met
    _fastForward(_idleRequirement % numIncrements);
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
    _stockAccount(playerIndex);
    _petIDs[playerIndex] = _mintPets(playerIndex, numPets);
    _fastForward(_idleRequirement);

    // start and stop productions for these pets so they're populated
    uint[] memory playerProductionIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      playerProductionIDs[i] = _startProduction(_petIDs[playerIndex][i], nodeID);
      _fastForward(_idleRequirement);
      _stopProduction(playerProductionIDs[i]);
    }
    _fastForward(_idleRequirement);

    // create a supporting account
    _stockAccount(supportPlayerIndex);
    _petIDs[supportPlayerIndex] = _mintPets(supportPlayerIndex, numPets);
    _fastForward(_idleRequirement);

    // check that pets CANNOT liquidate when RESTING
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("FarmLiquidate: pet must be harvesting");
      vm.prank(_getOperator(playerIndex));
      _ProductionLiquidateSystem.executeTyped(victimProductionIDs[i], _petIDs[playerIndex][i]);
    }

    // start out player's productions and starve their pets
    for (uint i = 0; i < numPets; i++) {
      _startProduction(_petIDs[playerIndex][i], nodeID);
    }
    _fastForward(100 hours);

    // check that pets CANNOT liquidate when Starving
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("FarmLiquidate: pet starving..");
      vm.prank(_getOperator(playerIndex));
      _ProductionLiquidateSystem.executeTyped(victimProductionIDs[i], _petIDs[playerIndex][i]);
    }

    // kill off our player's pets
    uint[] memory supportProductionIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      supportProductionIDs[i] = _startProduction(_petIDs[supportPlayerIndex][i], nodeID);
      _fastForward(_idleRequirement);
      _liquidateProduction(_petIDs[supportPlayerIndex][i], playerProductionIDs[i]);
    }

    // fast forward as syncHealth resets both pets' last action times during liquidation
    _fastForward(_idleRequirement);

    // check that pets CANNOT liquidate when DEAD
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("FarmLiquidate: pet must be harvesting");
      vm.prank(_getOperator(playerIndex));
      _ProductionLiquidateSystem.executeTyped(victimProductionIDs[i], _petIDs[playerIndex][i]);
    }

    // starve out our support player's productions
    _fastForward(100 hours);

    // revive our pets and start their productions
    for (uint i = 0; i < numPets; i++) {
      _revivePet(_petIDs[playerIndex][i], 1000); // hardcoded for now
      _fastForward(_idleRequirement);
      _startProduction(_petIDs[playerIndex][i], nodeID);
    }
    _fastForward(_idleRequirement);

    // check that pets CAN liquidate when HARVESTING
    for (uint i = 0; i < numPets; i++) {
      _liquidateProduction(_petIDs[playerIndex][i], victimProductionIDs[i]);
    }
    _fastForward(_idleRequirement);

    // check that pets CAN can liquidate in succession once idle requirement is met
    for (uint i = 0; i < numPets; i++) {
      _feedPet(_petIDs[playerIndex][i], 2);
      _fastForward(_idleRequirement);
      _liquidateProduction(_petIDs[playerIndex][i], supportProductionIDs[i]);
    }
  }

  // // run a test to ensure that liquidations are only honored at calculated thresholds
  // function testMurderThresholdConstraint() public {
  //   uint numPets = 6; // number of pets per account
  //   uint numPlayers = 5;

  //   // create, fund and stock our accounts
  //   for (uint i = 0; i < numPlayers; i++) {
  //     _stockAccount(i);
  //     _petIDs[i] = _mintPets(i, numPets);
  //   }
  //   _fastForward(_idleRequirement);

  //   // have all players start each pet's production on a random node
  //   uint nodeID;
  //   for (uint i = 0; i < numPlayers; i++) {
  //     for (uint j = 0; j < numPets; j++) {
  //       nodeID = _nodeIDs[uint(keccak256(abi.encodePacked(i, j))) % _nodeIDs.length];
  //       _moveAccount(i, LibNode.getRoom(components, nodeID));
  //       _startProduction(_petIDs[i][j], nodeID);
  //     }
  //   }

  //   // have our players interact in a in a round robin, commanding a single kami to
  //   // liquidate a random kami that shares a node. whether this succeeds or fails depends
  //   // on the respective stats of attacker and victim
  //   uint numIterations = 100;
  //   uint rand;
  //   uint playerIndex;
  //   uint petIndex;
  //   uint attackerID;
  //   uint victimID;
  //   uint productionID;
  //   uint[] memory productionIDs;
  //   for (uint i = 0; i < numIterations; i++) {
  //     rand = uint(keccak256(abi.encodePacked(i)));

  //     // set the stage
  //     playerIndex = rand % numPlayers;
  //     petIndex = rand % numPets;
  //     attackerID = _petIDs[playerIndex][petIndex];
  //     nodeID = LibProduction.getNode(components, LibPet.getProduction(components, attackerID));
  //     productionIDs = LibProduction.getAllOnNode(components, nodeID);
  //     productionID = productionIDs[rand % productionIDs.length];
  //     victimID = LibProduction.getPet(components, productionID);

  //     // fast forward 15-75min
  //     _fastForward((rand % 1 hours) + 15 minutes);

  //     // get the player and pet ready
  //     _moveAccount(playerIndex, LibNode.getRoom(components, nodeID));
  //     _feedPet(attackerID, 1);

  //     // fast forward by idle requirement
  //     _fastForward(_idleRequirement);

  //     // if production is liquidatable, liquidate it then revive pet. revert otherwise
  //     if (!_isLiquidatableBy(productionID, attackerID)) {
  //       vm.expectRevert("Pet: you lack violence");
  //       vm.prank(_getOperator(playerIndex));
  //       _ProductionLiquidateSystem.executeTyped(productionID, attackerID);
  //     } else {
  //       // liquidate, revive, heal
  //       _liquidateProduction(attackerID, productionID);
  //       _fastForward(_idleRequirement);
  //       _revivePet(victimID, 1000);
  //       _fastForward(_idleRequirement);
  //       _feedPet(victimID, 1);
  //       _fastForward(_idleRequirement);

  //       // put them on new node
  //       nodeID = _nodeIDs[rand % _nodeIDs.length];
  //       _moveAccount(_getOwnerPlayerIndex(victimID), LibNode.getRoom(components, nodeID));
  //       _startProduction(victimID, nodeID);
  //     }
  //   }
  // }
}
