// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "tests/utils/SetupTemplate.t.sol";

import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

contract MurderTest is SetupTemplate {
  uint[] internal _listingIDs;
  uint[] internal _foodRegistryIDs;
  uint[] internal _reviveRegistryIDs;
  uint[] internal _nodeIDs;
  mapping(uint => uint[]) internal _kamiIDs;

  function setUp() public override {
    super.setUp();

    _createNPC(1, 1, "Test NPC");
    _createFoodListings(1);
    _createReviveListings(1);

    _nodeIDs.push(_createHarvestingNode(1, 1, "Test Node", "this is a node", "NORMAL"));
    _nodeIDs.push(_createHarvestingNode(2, 1, "Test Node", "this is a node", "SCRAP"));
    _nodeIDs.push(_createHarvestingNode(3, 2, "Test Node", "this is a node", "EERIE"));
    _nodeIDs.push(_createHarvestingNode(4, 2, "Test Node", "this is a node", "INSECT"));
    _nodeIDs.push(_createHarvestingNode(5, 3, "Test Node", "this is a node", "NORMAL"));
  }

  function setUpItems() public override {
    // food (foodIndex, name, health)
    _foodRegistryIDs.push(_createFood(1, "Gum", "DESCRIPTION", 25, 0, "")); // itemIndex 1
    _foodRegistryIDs.push(_createFood(2, "Candy", "DESCRIPTION", 50, 0, "")); // itemIndex 2
    _foodRegistryIDs.push(_createFood(3, "Cookie Sticks", "DESCRIPTION", 100, 0, "")); // itemIndex 3

    // revives (reviveIndex, name, health)
    _reviveRegistryIDs.push(_createRevive(1000, "Ribbon", "DESCRIPTION", 10, "")); // itemIndex 1000
  }

  function setUpNodes() public override {}

  /////////////////
  // TESTS

  function testMurderBasic() public {
    // setup
    uint256 victimID = _mintKami(alice);
    uint256 killerID = _mintKami(bob);
    _fastForward(_idleRequirement);

    // alice places pet, left to farm and die
    uint256 aProdID = _startHarvest(victimID, _nodeIDs[0]);
    _fastForward(24 hours);

    // bob places pet
    uint256 bProdID = _startHarvest(killerID, _nodeIDs[0]);
    _fastForward(_idleRequirement);

    // simulate a crime
    uint256 initialBalance = _getHarvestBounty(bProdID);
    uint256 bounty = _getHarvestBounty(aProdID);
    uint256 salvage = LibKill.calcSalvage(components, victimID, bounty);
    uint256 spoils = LibKill.calcSpoils(components, killerID, bounty - salvage);

    // commit said crime
    _liquidateHarvest(killerID, aProdID);

    // verify crime balances
    assertEq(
      LibHarvest.getBalance(components, bProdID),
      initialBalance + spoils,
      "killer balance mismatch"
    );
    assertEq(_getHarvestBounty(aProdID), 0, "victim prod balance >0");
    assertEq(_getItemBal(alice, MUSU_INDEX), salvage, "victim balance mismatch");
    assertTrue(LibKami.isState(components, victimID, "DEAD"), "victim not dead");
    assertFalse(LibHarvest.isActive(components, aProdID), "victim harvest not stopped");
  }

  // test that the correct account must call the liquidation
  function testMurderPermissionConstraints() public {
    uint numAccounts = 5;
    uint numPets = 5; // number of pets per account
    uint nodeID = _nodeIDs[0];
    uint[] memory victimHarvestIDs = _setupDrainedHarvests(9, numPets, nodeID);

    // create and stock a bunch of accounts with revives and kamis
    for (uint i = 0; i < numAccounts; i++) _kamiIDs[i] = _mintKamis(i, numPets);
    _fastForward(_idleRequirement);

    // start harvest on node with other account's kamis, fast forward by idle time requirement
    for (uint i = 0; i < numAccounts; i++) {
      for (uint j = 0; j < numPets; j++) _startHarvest(_kamiIDs[i][j], nodeID);
    }
    _fastForward(_idleRequirement);

    // check that we CANNOT liquidate the starved kamis from the wrong account
    for (uint i = 1; i < numAccounts; i++) {
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("kami not urs");
        vm.prank(_getOperator(i));
        _HarvestLiquidateSystem.executeTyped(victimHarvestIDs[j], _kamiIDs[0][j]);
      }
    }

    // check that we CAN liquidate starved kamis from the right account
    for (uint i = 0; i < numPets; i++) _liquidateHarvest(_kamiIDs[0][i], victimHarvestIDs[i]);
  }

  // test that the player must be in the same room to command liquidations
  function testMurderAccountRoomIndexConstraints() public {
    uint numPets = 5; // number of kamis per account
    uint playerIndex = 0; // the player we're playing with
    uint nodeID = _nodeIDs[0];
    uint[] memory harvestIDs = _setupDrainedHarvests(9, numPets, nodeID);

    // create acting account and mint its kamis
    _kamiIDs[playerIndex] = _mintKamis(playerIndex, numPets);
    _fastForward(_idleRequirement);

    // start harvest on the right Node
    for (uint j = 0; j < numPets; j++) _startHarvest(_kamiIDs[playerIndex][j], nodeID);
    _fastForward(_idleRequirement);

    // move the Account to room 2
    // check that we CANNOT liquidate
    _moveAccount(playerIndex, 2);
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("node too far");
      vm.prank(_getOperator(playerIndex));
      _HarvestLiquidateSystem.executeTyped(harvestIDs[i], _kamiIDs[playerIndex][i]);
    }

    // move the Account to room 3
    // check that we CANNOT liquidate
    _moveAccount(playerIndex, 3);
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("node too far");
      vm.prank(_getOperator(playerIndex));
      _HarvestLiquidateSystem.executeTyped(harvestIDs[i], _kamiIDs[playerIndex][i]);
    }

    // move the Account to room 1
    // check that we CAN liquidate
    _moveAccount(playerIndex, 1);
    for (uint i = 0; i < numPets; i++) _liquidateHarvest(_kamiIDs[playerIndex][i], harvestIDs[i]);
  }

  // test that the pets must be on the same Node to liquidate one another
  function testMurderNodeConstraints() public {
    uint numPets = 5; // number of kamis per account
    uint playerIndex = 0; // the player we're playing with
    uint[] memory victimHarvestIDs = _setupDrainedHarvests(9, numPets, _nodeIDs[0]);

    // create acting account and mint its kamis
    _kamiIDs[playerIndex] = _mintKamis(playerIndex, numPets);
    _fastForward(_idleRequirement);

    // confirm we CANNOT liquidate from the wrong nodes
    uint32 roomIndex;
    uint[] memory playerHarvestIDs = new uint[](numPets);
    for (uint i = 1; i < _nodeIDs.length; i++) {
      // move to the room where the Node is
      roomIndex = LibNode.getRoom(components, _nodeIDs[i]);
      if (LibAccount.getRoom(components, _getAccount(playerIndex)) != roomIndex)
        _moveAccount(playerIndex, roomIndex);

      // start harvests for all pets
      for (uint j = 0; j < numPets; j++)
        playerHarvestIDs[j] = _startHarvest(_kamiIDs[playerIndex][j], _nodeIDs[i]);
      _fastForward(_idleRequirement);

      // attempt to liquidate, then stop harvest
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("target too far");
        vm.prank(_getOperator(playerIndex));
        _HarvestLiquidateSystem.executeTyped(victimHarvestIDs[j], _kamiIDs[playerIndex][j]);
        _stopHarvest(playerHarvestIDs[j]);
      }
      _fastForward(_idleRequirement);
    }

    // move to the room where Node1 is
    roomIndex = LibNode.getRoom(components, _nodeIDs[0]);
    if (LibAccount.getRoom(components, _getAccount(playerIndex)) != roomIndex)
      _moveAccount(playerIndex, roomIndex);

    // start harvest on right Node for second account's kamis
    for (uint i = 0; i < numPets; i++) _startHarvest(_kamiIDs[playerIndex][i], _nodeIDs[0]);
    _fastForward(_idleRequirement);

    // check that we CAN liquidate
    for (uint i = 0; i < numPets; i++)
      _liquidateHarvest(_kamiIDs[playerIndex][i], victimHarvestIDs[i]);
  }

  // test that we cannot unless we meet idle requirements
  function testMurderIdleConstraint() public {
    uint numPets = 5; // number of kamis per account
    uint playerIndex = 0; // the player we're playing with
    uint nodeID = _nodeIDs[0];
    uint[] memory victimHarvestIDs = _setupDrainedHarvests(9, numPets, nodeID);
    _fastForward(_idleRequirement);

    // create acting account and mint its kamis
    _kamiIDs[playerIndex] = _mintKamis(playerIndex, numPets);
    _fastForward(_idleRequirement);

    // start harvesting on the same node as our victims
    uint[] memory playerHarvestIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++)
      playerHarvestIDs[i] = _startHarvest(_kamiIDs[playerIndex][i], nodeID);

    // check that we CANNOT liquidate anytime before the idle requirement is met
    uint numIncrements = 7; // KAMI_STANDARD_COOLDOWN must not be divisible by this number
    for (uint i = 0; i < numIncrements; i++) {
      _fastForward(_idleRequirement / numIncrements);

      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("kami on cooldown");
        vm.prank(_getOperator(playerIndex));
        _HarvestLiquidateSystem.executeTyped(victimHarvestIDs[j], _kamiIDs[playerIndex][j]);
      }
    }

    // check that we CAN liquidate after the idle requirement is met
    _fastForward(_idleRequirement % numIncrements);
    for (uint i = 0; i < numPets; i++)
      _liquidateHarvest(_kamiIDs[playerIndex][i], victimHarvestIDs[i]);
  }

  // check that pets can only liquidate when both victim and attacker are HARVESTING
  function testMurderStateConstraints() public {
    uint numPets = 5; // number of pets per account
    uint playerIndex = 0; // the player we're playing with
    uint supportPlayerIndex = 1; // the player acting in the background to support test
    uint nodeID = _nodeIDs[0];
    uint[] memory victimHarvestIDs = _setupDrainedHarvests(9, numPets, nodeID);

    // create acting account and mint its pets
    _stockAccount(playerIndex);
    _kamiIDs[playerIndex] = _mintKamis(playerIndex, numPets);
    _fastForward(_idleRequirement);

    // start and stop harvests for these pets so they're populated
    uint[] memory playerHarvestIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      playerHarvestIDs[i] = _startHarvest(_kamiIDs[playerIndex][i], nodeID);
      _fastForward(_idleRequirement);
      _stopHarvest(playerHarvestIDs[i]);
    }
    _fastForward(_idleRequirement);

    // create a supporting account
    _stockAccount(supportPlayerIndex);
    _kamiIDs[supportPlayerIndex] = _mintKamis(supportPlayerIndex, numPets);
    _fastForward(_idleRequirement);

    // check that pets CANNOT liquidate when RESTING
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("kami not HARVESTING");
      vm.prank(_getOperator(playerIndex));
      _HarvestLiquidateSystem.executeTyped(victimHarvestIDs[i], _kamiIDs[playerIndex][i]);
    }

    // start out player's harvests and starve their pets
    for (uint i = 0; i < numPets; i++) _startHarvest(_kamiIDs[playerIndex][i], nodeID);
    _fastForward(100 hours);

    // check that pets CANNOT liquidate when Starving
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("kami starving..");
      vm.prank(_getOperator(playerIndex));
      _HarvestLiquidateSystem.executeTyped(victimHarvestIDs[i], _kamiIDs[playerIndex][i]);
    }

    // kill off our player's pets
    uint[] memory supportHarvestIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      supportHarvestIDs[i] = _startHarvest(_kamiIDs[supportPlayerIndex][i], nodeID);
      _fastForward(_idleRequirement);
      _liquidateHarvest(_kamiIDs[supportPlayerIndex][i], playerHarvestIDs[i]);
    }

    // fast forward as syncHealth resets both pets' last action times during liquidation
    _fastForward(_idleRequirement);

    // check that pets CANNOT liquidate when DEAD
    for (uint i = 0; i < numPets; i++) {
      vm.expectRevert("kami not HARVESTING");
      vm.prank(_getOperator(playerIndex));
      _HarvestLiquidateSystem.executeTyped(victimHarvestIDs[i], _kamiIDs[playerIndex][i]);
    }

    // starve out our support player's harvests
    _fastForward(100 hours);

    // revive our pets and start their harvests
    for (uint i = 0; i < numPets; i++) {
      _revivePet(_kamiIDs[playerIndex][i], 1000); // hardcoded for now
      _fastForward(_idleRequirement);
      _startHarvest(_kamiIDs[playerIndex][i], nodeID);
    }
    _fastForward(_idleRequirement);

    // check that pets CAN liquidate when HARVESTING
    for (uint i = 0; i < numPets; i++)
      _liquidateHarvest(_kamiIDs[playerIndex][i], victimHarvestIDs[i]);
    _fastForward(_idleRequirement);

    // check that pets CAN can liquidate in succession once idle requirement is met
    for (uint i = 0; i < numPets; i++) {
      _feedPet(_kamiIDs[playerIndex][i], 2);
      _fastForward(_idleRequirement);
      _liquidateHarvest(_kamiIDs[playerIndex][i], supportHarvestIDs[i]);
    }
  }

  // // run a test to ensure that liquidations are only honored at calculated thresholds
  // function testMurderThresholdConstraint() public {
  //   uint numPets = 6; // number of pets per account
  //   uint numPlayers = 5;

  //   // create, fund and stock our accounts
  //   for (uint i = 0; i < numPlayers; i++) {
  //     _stockAccount(i);
  //     _kamiIDs[i] = _mintKamis(i, numPets);
  //   }
  //   _fastForward(_idleRequirement);

  //   // have all players start each pet's harvest on a random node
  //   uint nodeID;
  //   for (uint i = 0; i < numPlayers; i++) {
  //     for (uint j = 0; j < numPets; j++) {
  //       nodeID = _nodeIDs[uint(keccak256(abi.encodePacked(i, j))) % _nodeIDs.length];
  //       _moveAccount(i, LibNode.getRoom(components, nodeID));
  //       _startHarvest(_kamiIDs[i][j], nodeID);
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
  //   uint harvestID;
  //   uint[] memory harvestIDs;
  //   for (uint i = 0; i < numIterations; i++) {
  //     rand = uint(keccak256(abi.encodePacked(i)));

  //     // set the stage
  //     playerIndex = rand % numPlayers;
  //     petIndex = rand % numPets;
  //     attackerID = _kamiIDs[playerIndex][petIndex];
  //     nodeID = LibHarvest.getNode(components, LibKami.getHarvest(components, attackerID));
  //     harvestIDs = getAllOnNode(components, nodeID);
  //     harvestID = harvestIDs[rand % harvestIDs.length];
  //     victimID = LibHarvest.getKami(components, harvestID);

  //     // fast forward 15-75min
  //     _fastForward((rand % 1 hours) + 15 minutes);

  //     // get the player and pet ready
  //     _moveAccount(playerIndex, LibNode.getRoom(components, nodeID));
  //     _feedPet(attackerID, 1);

  //     // fast forward by idle requirement
  //     _fastForward(_idleRequirement);

  //     // if production is liquidatable, liquidate it then revive pet. revert otherwise
  //     if (!_isLiquidatableBy(productionID, attackerID)) {
  //       vm.expectRevert("kami lacks violence (weak)");
  //       vm.prank(_getOperator(playerIndex));
  //       _HarvestLiquidateSystem.executeTyped(harvestID, attackerID);
  //     } else {
  //       // liquidate, revive, heal
  //       _liquidateHarvest(attackerID, harvestID);
  //       _fastForward(_idleRequirement);
  //       _revivePet(victimID, 1000);
  //       _fastForward(_idleRequirement);
  //       _feedPet(victimID, 1);
  //       _fastForward(_idleRequirement);

  //       // put them on new node
  //       nodeID = _nodeIDs[rand % _nodeIDs.length];
  //       _moveAccount(_getOwnerPlayerIndex(victimID), LibNode.getRoom(components, nodeID));
  //       _startHarvest(victimID, nodeID);
  //     }
  //   }
  // }

  /////////////////
  // HELPER FUNCTIONS

  function _getHarvestBounty(uint harvID) internal view returns (uint) {
    uint256 existing = LibHarvest.getBalance(components, harvID);
    uint256 increase = LibHarvest.calcBounty(components, harvID);
    return existing + increase;
  }

  function _createFoodListings(uint32 npcIndex) internal {
    uint32 itemIndex;
    uint[] memory registryIDs = _foodRegistryIDs;
    for (uint i = 0; i < registryIDs.length; i++) {
      itemIndex = _IndexItemComponent.get(registryIDs[i]);
      _listingIDs.push(_setListing(npcIndex, itemIndex, 10, 10));
    }
  }

  function _createReviveListings(uint32 npcIndex) internal {
    uint32 itemIndex;
    uint[] memory registryIDs = _reviveRegistryIDs;
    for (uint i = 0; i < registryIDs.length; i++) {
      itemIndex = _IndexItemComponent.get(registryIDs[i]);
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

  // checks whether a harvest should be liquidatable by a pet
  // assumes the harvest is active to simulate a health sync
  function _isLiquidatableBy(uint harvestID, uint attackerID) internal view returns (bool) {
    uint victimID = LibHarvest.getKami(components, harvestID);
    uint totalHealth = uint(int(LibStat.getTotal(components, "HEALTH", victimID)));
    uint output = LibHarvest.calcBounty(components, harvestID);
    uint drain = LibKami.calcStrain(components, victimID, output);
    uint health = uint(int(LibStat.get(components, "HEALTH", victimID).sync));
    health = (health > drain) ? health - drain : 0;

    uint threshold = LibKill.calcAnimosity(components, attackerID, victimID); // 1e18 precision
    return threshold * totalHealth > health * 1e18;
  }

  // gets the playerIndex of a pet's owner
  function _getOwnerPlayerIndex(uint kamiID) internal view returns (uint) {
    uint accID = LibKami.getAccount(components, kamiID);
    address owner = LibAccount.getOwner(components, accID);
    for (uint i = 0; i < _owners.length; i++) {
      if (_owners[i] == owner) {
        return i;
      }
    }
  }

  // creates an account and sets up a bunch of drained kamis on the first node with it
  function _setupDrainedHarvests(
    uint playerIndex,
    uint numPets,
    uint nodeID
  ) internal returns (uint[] memory) {
    _kamiIDs[playerIndex] = _mintKamis(playerIndex, numPets);
    _fastForward(_idleRequirement);

    uint[] memory harvestIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      harvestIDs[i] = _startHarvest(_kamiIDs[playerIndex][i], nodeID);
    }
    _fastForward(100 hours);
    return harvestIDs;
  }
}
