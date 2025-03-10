// // SPDX-License-Identifier: Unlicense
// pragma solidity >=0.8.28;

// import "tests/utils/SetupTemplate.t.sol";

// // this includes the feeding of both food and revives
// contract FeedingTest is SetupTemplate {
//   uint internal _npcID;
//   uint internal _nodeID;
//   uint[] internal _listingIDs;
//   uint[] internal _foodRegistryIDs;
//   uint[] internal _reviveRegistryIDs;

//   function setUp() public override {
//     super.setUp();

//     _nodeID = LibNode.getByIndex(components, 1);
//     _npcID = _createNPC(1, 1, "Test NPC");
//   }

//   function setUpItems() public override {
//     // food (foodIndex, name, health)
//     _foodRegistryIDs.push(_createFood(1, "Gum", "DESCRIPTION", 25, 0, "")); // itemIndex 1
//     _foodRegistryIDs.push(_createFood(2, "Candy", "DESCRIPTION", 50, 0, "")); // itemIndex 2
//     _foodRegistryIDs.push(_createFood(3, "Cookie Sticks", "DESCRIPTION", 100, 0, "")); // itemIndex 3

//     // revives (reviveIndex, name, health)
//     _reviveRegistryIDs.push(_createRevive(1000, "Ribbon", "DESCRIPTION", 10, "")); // itemIndex 1000
//   }

//   /////////////////
//   // HELPER FUNCTIONS

//   function _getListingItemIndex(uint listingID) internal view returns (uint32) {
//     uint registryID = LibItem.getByInstance(components, listingID);
//     return _IndexItemComponent.get(registryID);
//   }

//   function _getFoodHealAmount(uint32 index) internal view returns (int32) {
//     uint registryID = LibItem.getByIndex(components, index);
//     return LibStat.get(components, "HEALTH", registryID).base;
//   }

//   function _calcHarvestingPetHealth(uint kamiID) internal view returns (uint) {
//     uint harvestID = LibKami.getHarvest(components, kamiID);
//     uint output = LibHarvest.calcBounty(components, harvestID);
//     uint drain = LibKami.calcStrain(components, kamiID, output);
//     uint health = uint(int(LibStat.get(components, "HEALTH", kamiID).sync));
//     health = (health > drain) ? health - drain : 0;
//     return health;
//   }

//   function _createFoodListings(uint32 npcIndex) internal {
//     uint32 itemIndex;
//     uint[] memory registryIDs = _foodRegistryIDs;
//     for (uint i = 0; i < registryIDs.length; i++) {
//       itemIndex = _IndexItemComponent.get(registryIDs[i]);
//       _listingIDs.push(_setListing(npcIndex, itemIndex, 10, 10));
//     }
//   }

//   function _createReviveListings(uint32 npcIndex) internal {
//     uint32 itemIndex;
//     uint[] memory registryIDs = _reviveRegistryIDs;
//     for (uint i = 0; i < registryIDs.length; i++) {
//       itemIndex = _IndexItemComponent.get(registryIDs[i]);
//       _listingIDs.push(_setListing(npcIndex, itemIndex, 10, 10));
//     }
//   }

//   /////////////////
//   // TESTS

//   // test that feeding is only permissioned to the operating account of a pet
//   function testFeedPermissionConstraints() public {
//     uint32 npcIndex = LibNPC.getIndex(components, _npcID);
//     _createFoodListings(npcIndex);

//     // register some new accounts and buy some items through them
//     uint numAccounts = 4;
//     for (uint i = 0; i < numAccounts; i++) {
//       _fundAccount(i, 1e6);
//       for (uint j = 0; j < _listingIDs.length; j++) {
//         _buyFromListing(i, _listingIDs[j], 10);
//       }
//     }

//     // mint some pets for the default account
//     uint numPets = 5;
//     uint[] memory kamiIDs = _mintKamis(0, numPets);

//     // start their harvests
//     _fastForward(_idleRequirement);
//     for (uint i = 0; i < numPets; i++) {
//       _startHarvest(kamiIDs[i], _nodeID);
//     }

//     // fast forward 1hr to drain
//     _fastForward(_idleRequirement + 1 hours);

//     // attempt to feed them with each item from each account
//     uint32 itemIndex;
//     for (uint i = 1; i < numAccounts; i++) {
//       vm.startPrank(_getOperator(i));
//       for (uint j = 0; j < _listingIDs.length; j++) {
//         itemIndex = _getListingItemIndex(_listingIDs[j]);
//         for (uint k = 0; k < numPets; k++) {
//           vm.expectRevert("kami not urs");
//           _KamiUseItemSystem.executeTyped(kamiIDs[k], itemIndex);
//         }
//       }
//       vm.stopPrank();
//     }

//     // test that the owner account Can feed its own pets
//     vm.startPrank(_getOperator(0));
//     for (uint i = 0; i < _listingIDs.length; i++) {
//       itemIndex = _getListingItemIndex(_listingIDs[i]);
//       _fastForward(_idleRequirement + 1 hours);
//       for (uint j = 0; j < numPets; j++) {
//         _KamiUseItemSystem.executeTyped(kamiIDs[j], itemIndex);
//       }
//     }
//     vm.stopPrank();
//   }

//   // test that reviving is only permissioned to the operating account of a pet
//   // NOTE: only one revive item to check for these
//   function testRevivePermissionConstraints() public {
//     uint32 npcIndex = LibNPC.getIndex(components, _npcID);
//     _createReviveListings(npcIndex);
//     uint listingID = _listingIDs[0];
//     uint32 itemIndex = _getListingItemIndex(listingID);

//     // register some new accounts and buy some items through them
//     uint numAccounts = 4;
//     for (uint i = 0; i < numAccounts; i++) {
//       _fundAccount(i, 1e6);
//       _buyFromListing(i, listingID, 10);
//     }

//     // mint pets for the default account and drain them empty on harvesting
//     uint numPets = 5;
//     uint[] memory kamiIDs = _mintKamis(0, numPets);
//     uint[] memory harvestIDs = new uint[](numPets);
//     _fastForward(_idleRequirement);
//     for (uint i = 0; i < numPets; i++) {
//       harvestIDs[i] = _startHarvest(kamiIDs[i], _nodeID);
//     }
//     _fastForward(100 hours);

//     // start harvest for our new kamis and kill off the originals
//     uint[] memory kamiIDs2 = _mintKamis(1, numPets);
//     _fastForward(_idleRequirement);
//     for (uint i = 0; i < numPets; i++) {
//       _startHarvest(kamiIDs2[i], _nodeID);
//       _fastForward(_idleRequirement);
//       _liquidateHarvest(kamiIDs2[i], harvestIDs[i]);
//     }
//     _fastForward(_idleRequirement);

//     // check we CANNOT revive pets from other accounts
//     for (uint i = 1; i < numAccounts; i++) {
//       for (uint j = 0; j < numPets; j++) {
//         vm.expectRevert("kami not urs");
//         vm.prank(_getOperator(i));
//         _KamiUseItemSystem.executeTyped(kamiIDs[j], itemIndex);
//       }
//     }

//     // test that the owner account Can revive its own pets
//     for (uint i = 0; i < _listingIDs.length; i++) {
//       for (uint j = 0; j < numPets; j++) {
//         _reviveKami(kamiIDs[j], itemIndex);
//       }
//     }
//   }

//   // test that feeding is restricted by pet roomIndex in respect to account
//   function testFeedRoomIndexConstraints() public {
//     uint32 itemIndex;
//     uint32 npcIndex = LibNPC.getIndex(components, _npcID);
//     _createFoodListings(npcIndex);

//     // register, fund and stock account
//     uint playerIndex = 0;
//     _fundAccount(playerIndex, 1e6);
//     for (uint j = 0; j < _listingIDs.length; j++) {
//       _buyFromListing(playerIndex, _listingIDs[j], 10);
//     }

//     // mint some pets, fast forward and start their harvests
//     uint numPets = 5;
//     uint[] memory kamiIDs = _mintKamis(playerIndex, numPets);
//     _fastForward(_idleRequirement);
//     for (uint i = 0; i < numPets; i++) {
//       _startHarvest(kamiIDs[i], _nodeID);
//     }

//     // test that we Can feed pets at the current roomIndex
//     for (uint i = 0; i < _listingIDs.length; i++) {
//       itemIndex = _getListingItemIndex(_listingIDs[i]);
//       _fastForward(_idleRequirement + 1 hours);
//       for (uint j = 0; j < numPets; j++) {
//         _feedKami(kamiIDs[j], itemIndex);
//       }
//     }

//     // move the account to room 2 and test we Cannot feed pets
//     _moveAccount(playerIndex, 2);
//     vm.startPrank(_getOperator(playerIndex));
//     for (uint i = 0; i < _listingIDs.length; i++) {
//       itemIndex = _getListingItemIndex(_listingIDs[i]);
//       _fastForward(_idleRequirement + 1 hours);
//       for (uint j = 0; j < numPets; j++) {
//         vm.expectRevert("kami too far");
//         _KamiUseItemSystem.executeTyped(kamiIDs[j], itemIndex);
//       }
//     }
//     vm.stopPrank();

//     // move the account to room 3 and test we Cannot feed pets
//     _moveAccount(playerIndex, 3);
//     vm.startPrank(_getOperator(playerIndex));
//     for (uint i = 0; i < _listingIDs.length; i++) {
//       itemIndex = _getListingItemIndex(_listingIDs[i]);
//       _fastForward(_idleRequirement + 1 hours);
//       for (uint j = 0; j < numPets; j++) {
//         vm.expectRevert("kami too far");
//         _KamiUseItemSystem.executeTyped(kamiIDs[j], itemIndex);
//       }
//     }
//     vm.stopPrank();

//     // move the account back to room 1 and test we can Still feed pets
//     _moveAccount(playerIndex, 1);
//     for (uint i = 0; i < _listingIDs.length; i++) {
//       itemIndex = _getListingItemIndex(_listingIDs[i]);
//       _fastForward(_idleRequirement + 1 hours);
//       for (uint j = 0; j < numPets; j++) {
//         _feedKami(kamiIDs[j], itemIndex);
//       }
//     }
//   }

//   // test that reviving is restricted by pet state
//   function testFeedStateConstraints() public {
//     uint32 itemIndex;
//     uint32 npcIndex = LibNPC.getIndex(components, _npcID);
//     _createFoodListings(npcIndex);

//     // register, fund and stock account
//     uint playerIndex = 0;
//     _fundAccount(playerIndex, 1e9);
//     for (uint j = 0; j < _listingIDs.length; j++) {
//       _buyFromListing(playerIndex, _listingIDs[j], 100);
//     }

//     // mint some pets
//     uint numPets = 5;
//     uint[] memory kamiIDs = _mintKamis(playerIndex, numPets);
//     uint[] memory harvestIDs = new uint[](numPets);

//     // fast forward
//     _fastForward(_idleRequirement);

//     // start their harvest
//     for (uint i = 0; i < numPets; i++) {
//       harvestIDs[i] = _startHarvest(kamiIDs[i], _nodeID);
//     }

//     // check that we CAN feed when harvesting
//     for (uint i = 0; i < _listingIDs.length; i++) {
//       itemIndex = _getListingItemIndex(_listingIDs[i]);
//       _fastForward(_idleRequirement + 1 hours);
//       for (uint j = 0; j < numPets; j++) {
//         _feedKami(kamiIDs[j], itemIndex);
//       }
//     }

//     // check that we CAN feed when starving (pseudo-state)
//     for (uint i = 0; i < _listingIDs.length; i++) {
//       itemIndex = _getListingItemIndex(_listingIDs[i]);
//       _fastForward(_idleRequirement + 100 hours);
//       for (uint j = 0; j < numPets; j++) {
//         _feedKami(kamiIDs[j], itemIndex);
//       }
//     }

//     // stop harvests and check that we CAN feed resting pets
//     for (uint i = 0; i < _listingIDs.length; i++) {
//       itemIndex = _getListingItemIndex(_listingIDs[i]);
//       _fastForward(_idleRequirement + 1 hours);
//       for (uint j = 0; j < numPets; j++) {
//         _healKami(kamiIDs[j], 20); // healup kami, if was starving
//         _stopHarvest(harvestIDs[j]);
//         _fastForward(_idleRequirement);
//         _feedKami(kamiIDs[j], itemIndex);
//         _fastForward(_idleRequirement);
//         _startHarvest(kamiIDs[j], _nodeID);
//       }
//     }

//     // // stop all harvests and allow pets to heal to full
//     // for (uint i = 0; i < numPets; i++) {
//     //   _stopHarvest(harvestIDs[i]);
//     // }
//     // _currTime += _idleRequirement + 100 hours;
//     // vm.warp(_currTime);

//     // // check that we CANNOT feed when full (pseudo-state)
//     // for (uint i = 0; i < _listingIDs.length; i++) {
//     //   itemIndex = _getListingItemIndex(_listingIDs[i]);
//     //   for (uint j = 0; j < numPets; j++) {
//     //     vm.expectRevert("Pet: already full");
//     //     vm.prank(_getOperator(playerIndex));
//     //     _KamiUseItemSystem.executeTyped(kamiIDs[j], itemIndex);
//     //   }
//     // }

//     // // spawn some other kamis on a new account
//     // uint playerIndex2 = 1;
//     // uint[] memory kamiIDs2 = _mintKamis(playerIndex2, numPets);

//     // // start harvest for and starve our original kamis
//     // for (uint i = 0; i < numPets; i++) {
//     //   _startHarvest(kamiIDs[i], _nodeID);
//     // }
//     // _currTime += _idleRequirement + 100 hours;
//     // vm.warp(_currTime);

//     // // start harvest for our new kamis and kill off the originals
//     // for (uint i = 0; i < numPets; i++) {
//     //   _startHarvest(kamiIDs2[i], _nodeID);
//     //   _currTime += _idleRequirement + 15 minutes;
//     //   vm.warp(_currTime);
//     //   _liquidateHarvest(kamiIDs2[i], harvestIDs[i]);
//     // }

//     // // fast forward
//     // _currTime += _idleRequirement;
//     // vm.warp(_currTime);

//     // // check that we cannot feed when dead
//     // for (uint i = 0; i < _listingIDs.length; i++) {
//     //   itemIndex = _getListingItemIndex(_listingIDs[i]);
//     //   for (uint j = 0; j < numPets; j++) {
//     //     vm.expectRevert("Pet: must be resting|harvesting");
//     //     vm.prank(_getOperator(playerIndex));
//     //     _KamiUseItemSystem.executeTyped(kamiIDs[j], itemIndex);
//     //   }
//     // }
//   }

//   // test that reviving is restricted by pet state
//   function testReviveStateConstraints() public {
//     uint numPets = 5;
//     uint32 npcIndex = LibNPC.getIndex(components, _npcID);
//     _createReviveListings(npcIndex);
//     uint listingID = _listingIDs[0];
//     uint32 itemIndex = _getListingItemIndex(listingID);

//     // register, fund and stock account
//     uint playerIndex = 0;
//     _fundAccount(playerIndex, 1e9);
//     _buyFromListing(playerIndex, listingID, 100);
//     uint[] memory kamiIDs = _mintKamis(playerIndex, numPets);

//     // (resting, full hp) check that we CANNOT revive
//     _fastForward(_idleRequirement);
//     for (uint i = 0; i < numPets; i++) {
//       vm.prank(_getOperator(playerIndex));
//       vm.expectRevert("Item: Reqs not met");
//       _KamiUseItemSystem.executeTyped(kamiIDs[i], itemIndex);
//     }

//     // (harvesting, full hp) check that we CANNOT revive
//     uint[] memory harvestIDs = new uint[](numPets);
//     for (uint i = 0; i < numPets; i++) {
//       harvestIDs[i] = _startHarvest(kamiIDs[i], _nodeID);
//       _fastForward(_idleRequirement);
//       vm.prank(_getOperator(playerIndex));
//       vm.expectRevert("Item: Reqs not met");
//       _KamiUseItemSystem.executeTyped(kamiIDs[i], itemIndex);
//     }

//     // (harvesting, partial hp) check that we CANNOT revive
//     _fastForward(1 hours);
//     for (uint i = 0; i < numPets; i++) {
//       vm.prank(_getOperator(playerIndex));
//       vm.expectRevert("Item: Reqs not met");
//       _KamiUseItemSystem.executeTyped(kamiIDs[i], itemIndex);
//     }

//     // (harvesting, no hp) check that we CANNOT revive
//     _fastForward(100 hours);
//     for (uint i = 0; i < numPets; i++) {
//       vm.prank(_getOperator(playerIndex));
//       vm.expectRevert("Item: Reqs not met");
//       _KamiUseItemSystem.executeTyped(kamiIDs[i], itemIndex);
//     }

//     // start harvest for our enemy kamis and kill off the originals
//     uint playerIndex2 = 1;
//     uint[] memory kamiIDs2 = _mintKamis(playerIndex2, numPets);
//     _fastForward(_idleRequirement);
//     for (uint i = 0; i < numPets; i++) {
//       _startHarvest(kamiIDs2[i], _nodeID);
//       _fastForward(_idleRequirement);
//       _liquidateHarvest(kamiIDs2[i], harvestIDs[i]);
//     }
//     _fastForward(_idleRequirement);

//     // (dead) check that we CAN revive
//     for (uint i = 0; i < numPets; i++) {
//       _reviveKami(kamiIDs[i], itemIndex);
//     }

//     // (resting, partial hp) check that we CANNOT revive
//     _fastForward(_idleRequirement);
//     for (uint i = 0; i < numPets; i++) {
//       vm.prank(_getOperator(playerIndex));
//       vm.expectRevert("Item: Reqs not met");
//       _KamiUseItemSystem.executeTyped(kamiIDs[i], itemIndex);
//     }
//   }

//   // function testFeedEffects() public {
//   //   uint32 npcIndex = LibNPC.getIndex(components, _npcID);
//   //   _createFoodListings(npcIndex);

//   //   // register, fund and stock account
//   //   uint playerIndex = 0;
//   //   _fundAccount(playerIndex, 1e9);
//   //   for (uint j = 0; j < _listingIDs.length; j++) {
//   //     _buyFromListing(playerIndex, _listingIDs[j], 100);
//   //   }

//   //   // mint some pets and start their harvest
//   //   uint numPets = 5;
//   //   uint[] memory kamiIDs = _mintKamis(playerIndex, numPets);
//   //   _fastForward(_idleRequirement);
//   //   for (uint i = 0; i < numPets; i++) {
//   //     _startHarvest(kamiIDs[i], _nodeID);
//   //   }

//   //   // pass a number of iterations and
//   //   uint seed;
//   //   uint kamiID;
//   //   uint32 itemIndex;
//   //   uint timeDelta;
//   //   uint initialHealth;
//   //   uint healAmt;
//   //   uint finalHealth;
//   //   uint numIterations = 50;
//   //   for (uint i = 0; i < numIterations; i++) {
//   //     seed = uint(keccak256(abi.encode(i, block.timestamp)));
//   //     itemIndex = _getListingItemIndex(_listingIDs[seed % _listingIDs.length]);
//   //     kamiID = kamiIDs[seed % numPets];

//   //     timeDelta = (seed % 5 hours) + _idleRequirement;
//   //     _currTime += timeDelta;
//   //     vm.warp(_currTime);

//   //     initialHealth = _calcHarvestingPetHealth(kamiID);
//   //     healAmt = _getFoodHealAmount(itemIndex);
//   //     finalHealth = (initialHealth + healAmt > LibStat.get(components, "HEALTH",  kamiID))
//   //       ? LibStat.get(components, "HEALTH",  kamiID)
//   //       : initialHealth + healAmt;
//   //     _feedKami(kamiID, itemIndex);
//   //     assertEq(LibKami.getLastHealth(components, kamiID), finalHealth);
//   //   }
//   // }
// }
