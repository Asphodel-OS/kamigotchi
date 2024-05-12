// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

// this includes the feeding of both food and revives
contract FeedingTest is SetupTemplate {
  uint _idleRequirement;
  uint internal _npcID;
  uint internal _nodeID;
  uint[] internal _listingIDs;

  function setUp() public override {
    super.setUp();

    _nodeID = _createHarvestingNode(1, 1, "Test Node", "this is a node", "NORMAL");
    _npcID = _createNPC(1, 1, "Test NPC");

    _idleRequirement = LibConfig.get(components, "STANDARD_COOLDOWN");
  }

  /////////////////
  // HELPER FUNCTIONS

  function _getListingItemIndex(uint listingID) internal view returns (uint32) {
    uint registryID = LibRegistryItem.getByInstance(components, listingID);
    return LibRegistryItem.getIndex(components, registryID);
  }

  function _getFoodHealAmount(uint32 index) internal view returns (int32) {
    uint registryID = LibRegistryItem.getByIndex(components, index);
    return LibStat.getHealth(components, registryID).base;
  }

  function _calcHarvestingPetHealth(uint petID) internal view returns (uint) {
    uint productionID = LibPet.getProduction(components, petID);
    uint output = LibProduction.calcBounty(components, productionID);
    uint drain = LibPet.calcDrain(components, petID, output);
    uint health = uint(int(LibStat.getHealth(components, petID).sync));
    health = (health > drain) ? health - drain : 0;
    return health;
  }

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

  /////////////////
  // TESTS

  // test that feeding is only permissioned to the operating account of a pet
  function testFeedPermissionConstraints() public {
    uint32 npcIndex = LibNPC.getIndex(components, _npcID);
    _createFoodListings(npcIndex);

    // register some new accounts and buy some items through them
    uint numAccounts = 4;
    for (uint i = 0; i < numAccounts; i++) {
      _fundAccount(i, 1e6);
      for (uint j = 0; j < _listingIDs.length; j++) {
        _buyFromListing(i, _listingIDs[j], 10);
      }
    }

    // mint some pets for the default account
    uint numPets = 5;
    uint[] memory petIDs = _mintPets(0, numPets);

    // start their productions
    _fastForward(_idleRequirement);
    for (uint i = 0; i < numPets; i++) {
      _startProduction(petIDs[i], _nodeID);
    }

    // fast forward 1hr to drain
    _fastForward(_idleRequirement + 1 hours);

    // attempt to feed them with each item from each account
    uint32 itemIndex;
    for (uint i = 1; i < numAccounts; i++) {
      vm.startPrank(_getOperator(i));
      for (uint j = 0; j < _listingIDs.length; j++) {
        itemIndex = _getListingItemIndex(_listingIDs[j]);
        for (uint k = 0; k < numPets; k++) {
          vm.expectRevert("PetFeed: pet not urs");
          _PetFeedSystem.executeTyped(petIDs[k], itemIndex);
        }
      }
      vm.stopPrank();
    }

    // test that the owner account Can feed its own pets
    vm.startPrank(_getOperator(0));
    for (uint i = 0; i < _listingIDs.length; i++) {
      itemIndex = _getListingItemIndex(_listingIDs[i]);
      _fastForward(_idleRequirement + 1 hours);
      for (uint j = 0; j < numPets; j++) {
        _PetFeedSystem.executeTyped(petIDs[j], itemIndex);
      }
    }
    vm.stopPrank();
  }

  // test that reviving is only permissioned to the operating account of a pet
  // NOTE: only one revive item to check for these
  function testRevivePermissionConstraints() public {
    uint32 npcIndex = LibNPC.getIndex(components, _npcID);
    _createReviveListings(npcIndex);
    uint listingID = _listingIDs[0];
    uint32 itemIndex = _getListingItemIndex(listingID);

    // register some new accounts and buy some items through them
    uint numAccounts = 4;
    for (uint i = 0; i < numAccounts; i++) {
      _fundAccount(i, 1e6);
      _buyFromListing(i, listingID, 10);
    }

    // mint pets for the default account and drain them empty on harvesting
    uint numPets = 5;
    uint[] memory petIDs = _mintPets(0, numPets);
    uint[] memory productionIDs = new uint[](numPets);
    _fastForward(_idleRequirement);
    for (uint i = 0; i < numPets; i++) {
      productionIDs[i] = _startProduction(petIDs[i], _nodeID);
    }
    _fastForward(100 hours);

    // start production for our new kamis and kill off the originals
    uint[] memory petIDs2 = _mintPets(1, numPets);
    _fastForward(_idleRequirement);
    for (uint i = 0; i < numPets; i++) {
      _startProduction(petIDs2[i], _nodeID);
      _fastForward(_idleRequirement);
      _liquidateProduction(petIDs2[i], productionIDs[i]);
    }
    _fastForward(_idleRequirement);

    // check we CANNOT revive pets from other accounts
    for (uint i = 1; i < numAccounts; i++) {
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("PetRevive: pet not urs");
        vm.prank(_getOperator(i));
        _PetReviveSystem.executeTyped(petIDs[j], itemIndex);
      }
    }

    // test that the owner account Can revive its own pets
    for (uint i = 0; i < _listingIDs.length; i++) {
      for (uint j = 0; j < numPets; j++) {
        _revivePet(petIDs[j], itemIndex);
      }
    }
  }

  // test that feeding is restricted by pet roomIndex in respect to account
  function testFeedRoomIndexConstraints() public {
    uint32 itemIndex;
    uint32 npcIndex = LibNPC.getIndex(components, _npcID);
    _createFoodListings(npcIndex);

    // register, fund and stock account
    uint playerIndex = 0;
    _fundAccount(playerIndex, 1e6);
    for (uint j = 0; j < _listingIDs.length; j++) {
      _buyFromListing(playerIndex, _listingIDs[j], 10);
    }

    // mint some pets, fast forward and start their productions
    uint numPets = 5;
    uint[] memory petIDs = _mintPets(playerIndex, numPets);
    _fastForward(_idleRequirement);
    for (uint i = 0; i < numPets; i++) {
      _startProduction(petIDs[i], _nodeID);
    }

    // test that we Can feed pets at the current roomIndex
    for (uint i = 0; i < _listingIDs.length; i++) {
      itemIndex = _getListingItemIndex(_listingIDs[i]);
      _fastForward(_idleRequirement + 1 hours);
      for (uint j = 0; j < numPets; j++) {
        _feedPet(petIDs[j], itemIndex);
      }
    }

    // move the account to room 2 and test we Cannot feed pets
    _moveAccount(playerIndex, 2);
    vm.startPrank(_getOperator(playerIndex));
    for (uint i = 0; i < _listingIDs.length; i++) {
      itemIndex = _getListingItemIndex(_listingIDs[i]);
      _fastForward(_idleRequirement + 1 hours);
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("PetFeed: pet must be in same room");
        _PetFeedSystem.executeTyped(petIDs[j], itemIndex);
      }
    }
    vm.stopPrank();

    // move the account to room 3 and test we Cannot feed pets
    _moveAccount(playerIndex, 3);
    vm.startPrank(_getOperator(playerIndex));
    for (uint i = 0; i < _listingIDs.length; i++) {
      itemIndex = _getListingItemIndex(_listingIDs[i]);
      _fastForward(_idleRequirement + 1 hours);
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("PetFeed: pet must be in same room");
        _PetFeedSystem.executeTyped(petIDs[j], itemIndex);
      }
    }
    vm.stopPrank();

    // move the account back to room 1 and test we can Still feed pets
    _moveAccount(playerIndex, 1);
    for (uint i = 0; i < _listingIDs.length; i++) {
      itemIndex = _getListingItemIndex(_listingIDs[i]);
      _fastForward(_idleRequirement + 1 hours);
      for (uint j = 0; j < numPets; j++) {
        _feedPet(petIDs[j], itemIndex);
      }
    }
  }

  // test that reviving is restricted by pet state
  function testFeedStateConstraints() public {
    uint32 itemIndex;
    uint32 npcIndex = LibNPC.getIndex(components, _npcID);
    _createFoodListings(npcIndex);

    // register, fund and stock account
    uint playerIndex = 0;
    _fundAccount(playerIndex, 1e9);
    for (uint j = 0; j < _listingIDs.length; j++) {
      _buyFromListing(playerIndex, _listingIDs[j], 100);
    }

    // mint some pets
    uint numPets = 5;
    uint[] memory petIDs = _mintPets(playerIndex, numPets);
    uint[] memory productionIDs = new uint[](numPets);

    // fast forward
    _fastForward(_idleRequirement);

    // start their production
    for (uint i = 0; i < numPets; i++) {
      productionIDs[i] = _startProduction(petIDs[i], _nodeID);
    }

    // check that we CAN feed when harvesting
    for (uint i = 0; i < _listingIDs.length; i++) {
      itemIndex = _getListingItemIndex(_listingIDs[i]);
      _fastForward(_idleRequirement + 1 hours);
      for (uint j = 0; j < numPets; j++) {
        _feedPet(petIDs[j], itemIndex);
      }
    }

    // check that we CAN feed when starving (pseudo-state)
    for (uint i = 0; i < _listingIDs.length; i++) {
      itemIndex = _getListingItemIndex(_listingIDs[i]);
      _fastForward(_idleRequirement + 100 hours);
      for (uint j = 0; j < numPets; j++) {
        _feedPet(petIDs[j], itemIndex);
      }
    }

    // stop productions and check that we CAN feed resting pets
    for (uint i = 0; i < _listingIDs.length; i++) {
      itemIndex = _getListingItemIndex(_listingIDs[i]);
      _fastForward(_idleRequirement + 1 hours);
      for (uint j = 0; j < numPets; j++) {
        _stopProduction(productionIDs[j]);
        _fastForward(_idleRequirement);
        _feedPet(petIDs[j], itemIndex);
        _fastForward(_idleRequirement);
        _startProduction(petIDs[j], _nodeID);
      }
    }

    // // stop all productions and allow pets to heal to full
    // for (uint i = 0; i < numPets; i++) {
    //   _stopProduction(productionIDs[i]);
    // }
    // _currTime += _idleRequirement + 100 hours;
    // vm.warp(_currTime);

    // // check that we CANNOT feed when full (pseudo-state)
    // for (uint i = 0; i < _listingIDs.length; i++) {
    //   itemIndex = _getListingItemIndex(_listingIDs[i]);
    //   for (uint j = 0; j < numPets; j++) {
    //     vm.expectRevert("Pet: already full");
    //     vm.prank(_getOperator(playerIndex));
    //     _PetFeedSystem.executeTyped(petIDs[j], itemIndex);
    //   }
    // }

    // // spawn some other kamis on a new account
    // uint playerIndex2 = 1;
    // uint[] memory petIDs2 = _mintPets(playerIndex2, numPets);

    // // start production for and starve our original kamis
    // for (uint i = 0; i < numPets; i++) {
    //   _startProduction(petIDs[i], _nodeID);
    // }
    // _currTime += _idleRequirement + 100 hours;
    // vm.warp(_currTime);

    // // start production for our new kamis and kill off the originals
    // for (uint i = 0; i < numPets; i++) {
    //   _startProduction(petIDs2[i], _nodeID);
    //   _currTime += _idleRequirement + 15 minutes;
    //   vm.warp(_currTime);
    //   _liquidateProduction(petIDs2[i], productionIDs[i]);
    // }

    // // fast forward
    // _currTime += _idleRequirement;
    // vm.warp(_currTime);

    // // check that we cannot feed when dead
    // for (uint i = 0; i < _listingIDs.length; i++) {
    //   itemIndex = _getListingItemIndex(_listingIDs[i]);
    //   for (uint j = 0; j < numPets; j++) {
    //     vm.expectRevert("Pet: must be resting|harvesting");
    //     vm.prank(_getOperator(playerIndex));
    //     _PetFeedSystem.executeTyped(petIDs[j], itemIndex);
    //   }
    // }
  }

  // test that reviving is restricted by pet state
  function testReviveStateConstraints() public {
    uint numPets = 5;
    uint32 npcIndex = LibNPC.getIndex(components, _npcID);
    _createReviveListings(npcIndex);
    uint listingID = _listingIDs[0];
    uint32 itemIndex = _getListingItemIndex(listingID);

    // register, fund and stock account
    uint playerIndex = 0;
    _fundAccount(playerIndex, 1e9);
    _buyFromListing(playerIndex, listingID, 100);
    uint[] memory petIDs = _mintPets(playerIndex, numPets);

    // (resting, full hp) check that we CANNOT revive
    _fastForward(_idleRequirement);
    for (uint i = 0; i < numPets; i++) {
      vm.prank(_getOperator(playerIndex));
      vm.expectRevert("PetRevive: pet not dead");
      _PetReviveSystem.executeTyped(petIDs[i], itemIndex);
    }

    // (harvesting, full hp) check that we CANNOT revive
    uint[] memory productionIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      productionIDs[i] = _startProduction(petIDs[i], _nodeID);
      _fastForward(_idleRequirement);
      vm.prank(_getOperator(playerIndex));
      vm.expectRevert("PetRevive: pet not dead");
      _PetReviveSystem.executeTyped(petIDs[i], itemIndex);
    }

    // (harvesting, partial hp) check that we CANNOT revive
    _fastForward(1 hours);
    for (uint i = 0; i < numPets; i++) {
      vm.prank(_getOperator(playerIndex));
      vm.expectRevert("PetRevive: pet not dead");
      _PetReviveSystem.executeTyped(petIDs[i], itemIndex);
    }

    // (harvesting, no hp) check that we CANNOT revive
    _fastForward(100 hours);
    for (uint i = 0; i < numPets; i++) {
      vm.prank(_getOperator(playerIndex));
      vm.expectRevert("PetRevive: pet not dead");
      _PetReviveSystem.executeTyped(petIDs[i], itemIndex);
    }

    // start production for our enemy kamis and kill off the originals
    uint playerIndex2 = 1;
    uint[] memory petIDs2 = _mintPets(playerIndex2, numPets);
    _fastForward(_idleRequirement);
    for (uint i = 0; i < numPets; i++) {
      _startProduction(petIDs2[i], _nodeID);
      _fastForward(_idleRequirement);
      _liquidateProduction(petIDs2[i], productionIDs[i]);
    }
    _fastForward(_idleRequirement);

    // (dead) check that we CAN revive
    for (uint i = 0; i < numPets; i++) {
      _revivePet(petIDs[i], itemIndex);
    }

    // (resting, partial hp) check that we CANNOT revive
    _fastForward(_idleRequirement);
    for (uint i = 0; i < numPets; i++) {
      vm.prank(_getOperator(playerIndex));
      vm.expectRevert("PetRevive: pet not dead");
      _PetReviveSystem.executeTyped(petIDs[i], itemIndex);
    }
  }

  // function testFeedEffects() public {
  //   uint32 npcIndex = LibNPC.getIndex(components, _npcID);
  //   _createFoodListings(npcIndex);

  //   // register, fund and stock account
  //   uint playerIndex = 0;
  //   _fundAccount(playerIndex, 1e9);
  //   for (uint j = 0; j < _listingIDs.length; j++) {
  //     _buyFromListing(playerIndex, _listingIDs[j], 100);
  //   }

  //   // mint some pets and start their production
  //   uint numPets = 5;
  //   uint[] memory petIDs = _mintPets(playerIndex, numPets);
  //   _fastForward(_idleRequirement);
  //   for (uint i = 0; i < numPets; i++) {
  //     _startProduction(petIDs[i], _nodeID);
  //   }

  //   // pass a number of iterations and
  //   uint seed;
  //   uint petID;
  //   uint32 itemIndex;
  //   uint timeDelta;
  //   uint initialHealth;
  //   uint healAmt;
  //   uint finalHealth;
  //   uint numIterations = 50;
  //   for (uint i = 0; i < numIterations; i++) {
  //     seed = uint(keccak256(abi.encode(i, block.timestamp)));
  //     itemIndex = _getListingItemIndex(_listingIDs[seed % _listingIDs.length]);
  //     petID = petIDs[seed % numPets];

  //     timeDelta = (seed % 5 hours) + _idleRequirement;
  //     _currTime += timeDelta;
  //     vm.warp(_currTime);

  //     initialHealth = _calcHarvestingPetHealth(petID);
  //     healAmt = _getFoodHealAmount(itemIndex);
  //     finalHealth = (initialHealth + healAmt > LibStat.getHealth(components, petID))
  //       ? LibStat.getHealth(components, petID)
  //       : initialHealth + healAmt;
  //     _feedPet(petID, itemIndex);
  //     assertEq(LibPet.getLastHealth(components, petID), finalHealth);
  //   }
  // }
}
