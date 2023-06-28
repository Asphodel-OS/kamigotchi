// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";

import "test/utils/SetupTemplate.s.sol";

// this includes the feeding of both food and revives
contract FeedingTest is SetupTemplate {
  // structure of Listing data for test purposes
  struct TestListingData {
    uint merchantIndex;
    uint itemIndex;
    uint priceBuy;
    uint priceSell;
  }

  uint internal _merchantID;
  uint internal _nodeID;
  uint[] internal _listingIDs;

  function setUp() public override {
    super.setUp();

    _initTraits();
    _initItems();

    _createRoom("testRoom1", 1, 2, 3, 0);
    _createRoom("testRoom2", 2, 1, 3, 0);
    _createRoom("testRoom3", 3, 1, 2, 0);
    _nodeID = _createHarvestingNode(1, 1, "Test Node", "this is a node", "NORMAL");
    _merchantID = _createMerchant(1, 1, "Test Merchant");
  }

  /////////////////
  // HELPER FUNCTIONS

  function _getListingFoodIndex(uint listingID) internal view returns (uint) {
    uint registryItem = LibRegistryItem.getByInstance(components, listingID);
    return LibRegistryItem.getFoodIndex(components, registryItem);
  }

  function _getListingReviveIndex(uint listingID) internal view returns (uint) {
    uint registryItem = LibRegistryItem.getByInstance(components, listingID);
    return LibRegistryItem.getReviveIndex(components, registryItem);
  }

  function _getFoodHealAmount(uint foodIndex) internal view returns (uint) {
    uint registryID = LibRegistryItem.getByFoodIndex(components, foodIndex);
    return LibStat.getHealth(components, registryID);
  }

  function _calcHarvestingPetHealth(uint petID) internal view returns (uint) {
    uint drainAmt = LibPet.calcProductionDrain(components, petID);
    uint256 health = LibPet.getLastHealth(components, petID);
    health = (health > drainAmt) ? health - drainAmt : 0;
    return health;
  }

  function _createFoodListings(uint merchantIndex) internal {
    uint itemIndex;
    uint foodIndex;
    uint[] memory registryIDs = LibRegistryItem.getAllFood(components);
    for (uint i = 0; i < registryIDs.length; i++) {
      itemIndex = LibRegistryItem.getItemIndex(components, registryIDs[i]);
      foodIndex = LibRegistryItem.getFoodIndex(components, registryIDs[i]);
      _listingIDs.push(_setListing(merchantIndex, itemIndex, 10, 10));
    }
  }

  function _createReviveListings(uint merchantIndex) internal {
    uint itemIndex;
    uint reviveIndex;
    uint[] memory registryIDs = LibRegistryItem.getAllRevive(components);
    for (uint i = 0; i < registryIDs.length; i++) {
      itemIndex = LibRegistryItem.getItemIndex(components, registryIDs[i]);
      reviveIndex = LibRegistryItem.getReviveIndex(components, registryIDs[i]);
      _listingIDs.push(_setListing(merchantIndex, itemIndex, 10, 10));
    }
  }

  // easy function for getting the proper inputs to feed a pet
  function _feedPet(uint petID, uint foodIndex) internal {
    uint accountID = LibPet.getAccount(components, petID);
    address operator = LibAccount.getOperator(components, accountID);

    vm.prank(operator);
    _PetFeedSystem.executeTyped(petID, foodIndex);
  }

  // easy function for getting the proper inputs to revive a pet
  function _revivePet(uint petID, uint reviveIndex) internal {
    uint accountID = LibPet.getAccount(components, petID);
    address operator = LibAccount.getOperator(components, accountID);

    vm.prank(operator);
    _PetReviveSystem.executeTyped(petID, reviveIndex);
  }

  /////////////////
  // TESTS

  // test that feeding is only permissioned to the operating account of a pet
  function testFeedPermissionConstraints() public {
    uint foodIndex;
    uint currTime = 100;
    uint merchantIndex = LibMerchant.getIndex(components, _merchantID);
    _createFoodListings(merchantIndex);

    // register some new accounts and buy some items through them
    uint numAccounts = 4;
    for (uint i = 0; i < numAccounts; i++) {
      _registerAccount(i);
      _fundAccount(i, 1e6);
      for (uint j = 0; j < _listingIDs.length; j++) {
        _buyFromListing(i, _listingIDs[j], 10);
      }
    }

    // mint some pets for the default account and start their production
    uint numPets = 5;
    uint[] memory petIDs = _mintPets(0, numPets);
    vm.warp(currTime);
    for (uint i = 0; i < numPets; i++) {
      _startProduction(petIDs[i], _nodeID);
      // console.log("startTime: %d", startTime);
    }

    // fast forward 1hr to drain
    currTime += 1 hours;
    vm.warp(currTime);

    // drain the pets a bit and attempt to feed them with each item from each account
    for (uint i = 1; i < numAccounts; i++) {
      vm.startPrank(_getOperator(i));
      for (uint j = 0; j < _listingIDs.length; j++) {
        foodIndex = _getListingFoodIndex(_listingIDs[j]);
        for (uint k = 0; k < numPets; k++) {
          vm.expectRevert("Pet: not urs");
          _PetFeedSystem.executeTyped(petIDs[k], foodIndex);
        }
      }
      vm.stopPrank();
    }

    // test that the owner account Can feed its own pets
    vm.startPrank(_getOperator(0));
    for (uint i = 0; i < _listingIDs.length; i++) {
      foodIndex = _getListingFoodIndex(_listingIDs[i]);
      currTime += 1 hours;
      vm.warp(currTime);
      for (uint j = 0; j < numPets; j++) {
        _PetFeedSystem.executeTyped(petIDs[j], foodIndex);
      }
    }
    vm.stopPrank();
  }

  // test that reviving is only permissioned to the operating account of a pet
  // NOTE: only one revive item to check for these
  function testRevivePermissionConstraints() public {
    uint currTime = 100;
    uint merchantIndex = LibMerchant.getIndex(components, _merchantID);
    _createReviveListings(merchantIndex);
    uint listingID = _listingIDs[0];
    uint reviveIndex = _getListingReviveIndex(listingID);

    // register some new accounts and buy some items through them
    uint numAccounts = 4;
    for (uint i = 0; i < numAccounts; i++) {
      _registerAccount(i);
      _fundAccount(i, 1e6);
      _buyFromListing(i, listingID, 10);
    }

    // mint pets for the default account and drain them empty on harvesting
    uint numPets = 5;
    uint[] memory petIDs = _mintPets(0, numPets);
    uint[] memory productionIDs = new uint[](numPets);
    vm.warp(currTime);
    for (uint i = 0; i < numPets; i++) {
      productionIDs[i] = _startProduction(petIDs[i], _nodeID);
    }
    currTime += 100 hours;
    vm.warp(currTime);

    // start production for our new kamis and kill off the originals
    uint[] memory petIDs2 = _mintPets(1, numPets);
    for (uint i = 0; i < numPets; i++) {
      _startProduction(petIDs2[i], _nodeID);
      currTime += 15 minutes;
      vm.warp(currTime);
      _liquidateProduction(petIDs2[i], productionIDs[i]);
    }

    // check we CANNOT revive pets from other accounts
    for (uint i = 1; i < numAccounts; i++) {
      vm.startPrank(_getOperator(i));
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("Pet: not urs");
        _PetReviveSystem.executeTyped(petIDs[j], reviveIndex);
      }
      vm.stopPrank();
    }

    // test that the owner account Can revive its own pets
    for (uint i = 0; i < _listingIDs.length; i++) {
      for (uint j = 0; j < numPets; j++) {
        _revivePet(petIDs[j], reviveIndex);
      }
    }
  }

  // test that feeding is restricted by pet location in respect to account
  function testFeedLocationConstraints() public {
    uint foodIndex;
    uint currTime = 100;
    uint merchantIndex = LibMerchant.getIndex(components, _merchantID);
    _createFoodListings(merchantIndex);

    // register, fund and stock account
    uint playerIndex = 0;
    _registerAccount(playerIndex);
    _fundAccount(playerIndex, 1e6);
    for (uint j = 0; j < _listingIDs.length; j++) {
      _buyFromListing(playerIndex, _listingIDs[j], 10);
    }

    // mint some pets and start their production
    uint numPets = 5;
    uint[] memory petIDs = _mintPets(playerIndex, numPets);
    vm.warp(currTime);
    for (uint i = 0; i < numPets; i++) {
      _startProduction(petIDs[i], _nodeID);
    }

    // test that we Can feed pets at the current location
    for (uint i = 0; i < _listingIDs.length; i++) {
      foodIndex = _getListingFoodIndex(_listingIDs[i]);
      currTime += 1 hours;
      vm.warp(currTime);
      for (uint j = 0; j < numPets; j++) {
        _feedPet(petIDs[j], foodIndex);
      }
    }

    // move the account to room 2 and test we Cannot feed pets
    _moveAccount(playerIndex, 2);
    vm.startPrank(_getOperator(playerIndex));
    for (uint i = 0; i < _listingIDs.length; i++) {
      foodIndex = _getListingFoodIndex(_listingIDs[i]);
      currTime += 1 hours;
      vm.warp(currTime);
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("Pet: must be in same room");
        _PetFeedSystem.executeTyped(petIDs[j], foodIndex);
      }
    }
    vm.stopPrank();

    // move the account to room 3 and test we Cannot feed pets
    _moveAccount(playerIndex, 3);
    vm.startPrank(_getOperator(playerIndex));
    for (uint i = 0; i < _listingIDs.length; i++) {
      foodIndex = _getListingFoodIndex(_listingIDs[i]);
      currTime += 1 hours;
      vm.warp(currTime);
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("Pet: must be in same room");
        _PetFeedSystem.executeTyped(petIDs[j], foodIndex);
      }
    }
    vm.stopPrank();

    // move the account back to room 1 and test we can Still feed pets
    _moveAccount(playerIndex, 1);
    for (uint i = 0; i < _listingIDs.length; i++) {
      foodIndex = _getListingFoodIndex(_listingIDs[i]);
      currTime += 1 hours;
      vm.warp(currTime);
      for (uint j = 0; j < numPets; j++) {
        _feedPet(petIDs[j], foodIndex);
      }
    }
  }

  // test that reviving is restricted by pet state
  function testFeedStateConstraints() public {
    uint foodIndex;
    uint currTime = 100;
    uint merchantIndex = LibMerchant.getIndex(components, _merchantID);
    _createFoodListings(merchantIndex);

    // register, fund and stock account
    uint playerIndex = 0;
    _registerAccount(playerIndex);
    _fundAccount(playerIndex, 1e9);
    for (uint j = 0; j < _listingIDs.length; j++) {
      _buyFromListing(playerIndex, _listingIDs[j], 100);
    }

    // mint some pets and start their production
    uint numPets = 5;
    uint[] memory petIDs = _mintPets(playerIndex, numPets);
    uint[] memory productionIDs = new uint[](numPets);
    vm.warp(currTime);
    for (uint i = 0; i < numPets; i++) {
      productionIDs[i] = _startProduction(petIDs[i], _nodeID);
    }

    // check that we CAN feed when harvesting
    for (uint i = 0; i < _listingIDs.length; i++) {
      foodIndex = _getListingFoodIndex(_listingIDs[i]);
      currTime += 1 hours;
      vm.warp(currTime);
      for (uint j = 0; j < numPets; j++) {
        _feedPet(petIDs[j], foodIndex);
      }
    }

    // check that we CAN feed when starving (pseudo-state)
    for (uint i = 0; i < _listingIDs.length; i++) {
      foodIndex = _getListingFoodIndex(_listingIDs[i]);
      currTime += 100 hours;
      vm.warp(currTime);
      for (uint j = 0; j < numPets; j++) {
        _feedPet(petIDs[j], foodIndex);
      }
    }

    // stop productions and check that we CAN feed resting pets
    currTime += 1 hours;
    vm.warp(currTime);
    for (uint i = 0; i < _listingIDs.length; i++) {
      foodIndex = _getListingFoodIndex(_listingIDs[i]);
      for (uint j = 0; j < numPets; j++) {
        _stopProduction(productionIDs[j]);
        _feedPet(petIDs[j], foodIndex);
        _startProduction(petIDs[j], _nodeID);
      }
      currTime += 1 hours;
      vm.warp(currTime);
    }

    // stop all productions and allow pets to heal to full
    for (uint i = 0; i < numPets; i++) {
      _stopProduction(productionIDs[i]);
    }
    currTime += 100 hours;
    vm.warp(currTime);

    // check that we CANNOT feed when full (pseudo-state)
    for (uint i = 0; i < _listingIDs.length; i++) {
      foodIndex = _getListingFoodIndex(_listingIDs[i]);
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("Pet: already full");
        vm.prank(_getOperator(playerIndex));
        _PetFeedSystem.executeTyped(petIDs[j], foodIndex);
      }
    }

    // spawn some other kamis on a new account
    uint playerIndex2 = 1;
    _registerAccount(playerIndex2);
    uint[] memory petIDs2 = _mintPets(playerIndex2, numPets);

    // start production for and starve our original kamis
    for (uint i = 0; i < numPets; i++) {
      _startProduction(petIDs[i], _nodeID);
    }
    currTime += 100 hours;
    vm.warp(currTime);

    // start production for our new kamis and kill off the originals
    for (uint i = 0; i < numPets; i++) {
      _startProduction(petIDs2[i], _nodeID);
      currTime += 15 minutes;
      vm.warp(currTime);
      _liquidateProduction(petIDs2[i], productionIDs[i]);
    }

    // check that we cannot feed when dead
    for (uint i = 0; i < _listingIDs.length; i++) {
      foodIndex = _getListingFoodIndex(_listingIDs[i]);
      for (uint j = 0; j < numPets; j++) {
        vm.expectRevert("Pet: must be resting|harvesting");
        vm.prank(_getOperator(playerIndex));
        _PetFeedSystem.executeTyped(petIDs[j], foodIndex);
      }
    }
  }

  // test that reviving is restricted by pet state
  function testReviveStateConstraints() public {
    uint numPets = 5;
    uint currTime = 100;
    uint merchantIndex = LibMerchant.getIndex(components, _merchantID);
    _createReviveListings(merchantIndex);
    uint listingID = _listingIDs[0];
    uint reviveIndex = _getListingReviveIndex(listingID);

    // register, fund and stock account
    uint playerIndex = 0;
    _registerAccount(playerIndex);
    _fundAccount(playerIndex, 1e9);
    _buyFromListing(playerIndex, listingID, 100);
    uint[] memory petIDs = _mintPets(playerIndex, numPets);

    // (resting, full hp) check that we CANNOT revive
    for (uint i = 0; i < numPets; i++) {
      vm.prank(_getOperator(playerIndex));
      vm.expectRevert("Pet: must be dead");
      _PetReviveSystem.executeTyped(petIDs[i], reviveIndex);
    }

    // (harvesting, full hp) check that we CANNOT revive
    uint[] memory productionIDs = new uint[](numPets);
    for (uint i = 0; i < numPets; i++) {
      productionIDs[i] = _startProduction(petIDs[i], _nodeID);
      vm.prank(_getOperator(playerIndex));
      vm.expectRevert("Pet: must be dead");
      _PetReviveSystem.executeTyped(petIDs[i], reviveIndex);
    }

    // (harvesting, partial hp) check that we CANNOT revive
    currTime += 1 hours;
    vm.warp(currTime);
    for (uint i = 0; i < numPets; i++) {
      vm.prank(_getOperator(playerIndex));
      vm.expectRevert("Pet: must be dead");
      _PetReviveSystem.executeTyped(petIDs[i], reviveIndex);
    }

    // (harvesting, no hp) check that we CANNOT revive
    currTime += 100 hours;
    vm.warp(currTime);
    for (uint i = 0; i < numPets; i++) {
      vm.prank(_getOperator(playerIndex));
      vm.expectRevert("Pet: must be dead");
      _PetReviveSystem.executeTyped(petIDs[i], reviveIndex);
    }

    // start production for our enemy kamis and kill off the originals
    uint playerIndex2 = 1;
    _registerAccount(playerIndex2);
    uint[] memory petIDs2 = _mintPets(playerIndex2, numPets);
    for (uint i = 0; i < numPets; i++) {
      _startProduction(petIDs2[i], _nodeID);
      currTime += 15 minutes;
      vm.warp(currTime);
      _liquidateProduction(petIDs2[i], productionIDs[i]);
    }

    // (dead) check that we CAN revive
    for (uint i = 0; i < numPets; i++) {
      _revivePet(petIDs[i], reviveIndex);
    }

    // (resting, partial hp) check that we CANNOT revive
    for (uint i = 0; i < numPets; i++) {
      vm.prank(_getOperator(playerIndex));
      vm.expectRevert("Pet: must be dead");
      _PetReviveSystem.executeTyped(petIDs[i], reviveIndex);
    }
  }

  function testFeedEffects() public {
    uint currTime = 100;
    uint merchantIndex = LibMerchant.getIndex(components, _merchantID);
    _createFoodListings(merchantIndex);

    // register, fund and stock account
    uint playerIndex = 0;
    _registerAccount(playerIndex);
    _fundAccount(playerIndex, 1e9);
    for (uint j = 0; j < _listingIDs.length; j++) {
      _buyFromListing(playerIndex, _listingIDs[j], 100);
    }

    // mint some pets and start their production
    uint numPets = 5;
    uint[] memory petIDs = _mintPets(playerIndex, numPets);
    vm.warp(currTime);
    for (uint i = 0; i < numPets; i++) {
      _startProduction(petIDs[i], _nodeID);
    }

    // pass a number of iterations and
    uint seed;
    uint petID;
    uint foodIndex;
    uint timeDelta;
    uint initialHealth;
    uint healAmt;
    uint finalHealth;
    uint numIterations = 50;
    for (uint i = 0; i < numIterations; i++) {
      seed = uint(keccak256(abi.encode(i, block.timestamp)));
      foodIndex = _getListingFoodIndex(_listingIDs[seed % _listingIDs.length]);
      petID = petIDs[seed % numPets];

      timeDelta = (seed % 5 hours) + 15 minutes;
      currTime += timeDelta;
      vm.warp(currTime);

      initialHealth = _calcHarvestingPetHealth(petID);
      healAmt = _getFoodHealAmount(foodIndex);
      finalHealth = (initialHealth + healAmt > LibStat.getHealth(components, petID))
        ? LibStat.getHealth(components, petID)
        : initialHealth + healAmt;
      _feedPet(petID, foodIndex);
      assertEq(LibPet.getLastHealth(components, petID), finalHealth);
    }
  }
}
