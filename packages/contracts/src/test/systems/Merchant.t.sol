// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract NPCTest is SetupTemplate {
  // structure of Listing data for test purposes
  struct TestListingData {
    uint32 npcIndex;
    uint itemIndex;
    uint priceBuy;
    uint priceSell;
  }

  function setUp() public override {
    super.setUp();
  }

  function setUpItems() public override {
    _createGenericItem(1);
    _createGenericItem(2);
    _createGenericItem(3);
    _createGenericItem(4);
  }

  function setUpAccounts() public override {
    _createOwnerOperatorPairs(25);
  }

  /////////////////
  // TESTS

  // test the creation of a npc and the setting of its fields
  function testNPCCreation() public {
    // check that non-deployer cannot create a npc
    for (uint i = 0; i < 5; i++) {
      vm.prank(_getOwner(0));
      vm.expectRevert();
      __NPCCreateSystem.executeTyped(1, "testNPC", 2);

      vm.prank(_getOperator(0));
      vm.expectRevert();
      __NPCCreateSystem.executeTyped(2, "testNPC", 1);
    }

    // create a npc and ensure its fields are correct
    uint32 npcIndex1 = 1;
    uint npcRoomIndex1 = 3;
    string memory npcName1 = "testNPC";
    uint npcID1 = _createNPC(npcIndex1, npcRoomIndex1, npcName1);
    assertEq(npcIndex1, LibNPC.getIndex(components, npcID1));
    assertEq(npcRoomIndex1, LibNPC.getRoom(components, npcID1));
    assertEq(npcName1, LibNPC.getName(components, npcID1));

    // test that we can't create a npc with the same index
    vm.expectRevert("NPC: already exists");
    vm.prank(deployer);
    __NPCCreateSystem.executeTyped(1, "testNPC", 3); // index, name, roomIndex

    // but that we CAN create npc with the same name and roomIndex
    uint32 npcIndex2 = 2;
    uint npcRoomIndex2 = 3;
    string memory npcName2 = "testNPC";
    uint npcID2 = _createNPC(npcIndex2, npcRoomIndex2, npcName2);
    assertEq(npcIndex2, LibNPC.getIndex(components, npcID2));
    assertEq(npcRoomIndex2, LibNPC.getRoom(components, npcID2));
    assertEq(npcName2, LibNPC.getName(components, npcID2));
    // assertNotEq(npcID1, npcID2); // not available in this version of foundry

    // NOTE: we now have two npcs, named 'testNPC' at roomIndex 3

    // update fields on npc2 and check that both are correct
    uint newNPCRoomIndex = 2;
    string memory newNPCName = "newNPCName";
    vm.prank(deployer);
    __NPCSetRoomSystem.executeTyped(2, newNPCRoomIndex);
    vm.prank(deployer);
    __NPCSetNameSystem.executeTyped(2, newNPCName);

    assertEq(npcIndex1, LibNPC.getIndex(components, npcID1));
    assertEq(npcRoomIndex1, LibNPC.getRoom(components, npcID1));
    assertEq(npcName1, LibNPC.getName(components, npcID1));

    assertEq(npcIndex2, LibNPC.getIndex(components, npcID2));
    assertEq(newNPCRoomIndex, LibNPC.getRoom(components, npcID2));
    assertEq(newNPCName, LibNPC.getName(components, npcID2));

    // test that we can't update a npc that doesnt exist
    vm.prank(deployer);
    vm.expectRevert("NPC: does not exist");
    __NPCSetRoomSystem.executeTyped(3, newNPCRoomIndex);

    vm.prank(deployer);
    vm.expectRevert("NPC: does not exist");
    __NPCSetNameSystem.executeTyped(4, newNPCName);

    // test that we can't update a npc's attributes as a random address
    for (uint i = 0; i < 5; i++) {
      vm.startPrank(_getOwner(i));
      vm.expectRevert();
      __NPCSetRoomSystem.executeTyped(1, newNPCRoomIndex);

      vm.expectRevert();
      __NPCSetNameSystem.executeTyped(1, newNPCName);

      vm.expectRevert();
      __NPCSetRoomSystem.executeTyped(2, newNPCRoomIndex);

      vm.expectRevert();
      __NPCSetNameSystem.executeTyped(2, newNPCName);

      vm.stopPrank();
    }
  }

  // test the creation of a listing and the setting of its fields
  // listings work differently than npcs in that:
  // - they don't have an index unto themselves
  // - a listing is identified by NPCIndex and ItemIndex
  // - there is a single EP for both creating and updating a listing
  // - whether a listing is created or updated is autodetected based on its existence
  function testListingSetting() public {
    // create two npcs
    _createNPC(1, 1, "npc1");
    _createNPC(2, 2, "npc2");

    // check that non deployer cannot create a listing
    for (uint i = 0; i < 5; i++) {
      vm.prank(_getOwner(0));
      vm.expectRevert();
      __ListingSetSystem.executeTyped(1, 1, 50, 50);

      vm.prank(_getOperator(0));
      vm.expectRevert();
      __ListingSetSystem.executeTyped(2, 2, 50, 50);
    }

    // initial creation, check that item/npc indices and prices are correct
    uint numListings = 4;
    TestListingData[] memory listings = new TestListingData[](numListings);
    listings[0] = TestListingData(1, 1, 100, 50);
    listings[1] = TestListingData(1, 2, 80, 40);
    listings[2] = TestListingData(1, 3, 60, 30);
    listings[3] = TestListingData(1, 4, 40, 20);

    uint[] memory listingIDs = new uint[](numListings);
    for (uint i = 0; i < numListings; i++) {
      listingIDs[i] = _setListing(
        listings[i].npcIndex,
        listings[i].itemIndex,
        listings[i].priceBuy,
        listings[i].priceSell
      );
      assertEq(listings[i].npcIndex, LibListing.getNPCIndex(components, listingIDs[i]));
      assertEq(listings[i].itemIndex, LibListing.getItemIndex(components, listingIDs[i]));
      assertEq(listings[i].priceBuy, LibListing.getBuyPrice(components, listingIDs[i]));
      assertEq(listings[i].priceSell, LibListing.getSellPrice(components, listingIDs[i]));
    }

    // price update, check fields are updated correctly and listings are not duplicated
    listings[0] = TestListingData(1, 1, 10, 5);
    listings[1] = TestListingData(1, 2, 8, 4);
    listings[2] = TestListingData(1, 3, 6, 3);
    listings[3] = TestListingData(1, 4, 4, 2);

    uint newListingID;
    for (uint i = 0; i < numListings; i++) {
      newListingID = _setListing(
        listings[i].npcIndex,
        listings[i].itemIndex,
        listings[i].priceBuy,
        listings[i].priceSell
      );
      assertEq(newListingID, listingIDs[i]);
      assertEq(listings[i].npcIndex, LibListing.getNPCIndex(components, listingIDs[i]));
      assertEq(listings[i].itemIndex, LibListing.getItemIndex(components, listingIDs[i]));
      assertEq(listings[i].priceBuy, LibListing.getBuyPrice(components, listingIDs[i]));
      assertEq(listings[i].priceSell, LibListing.getSellPrice(components, listingIDs[i]));
    }

    // check that pulling by npc/item index yields the correct listing, or 0 if none exists
    // NOTE: this is somewhat of a given assumption of the test. but we should still verify
    for (uint i = 0; i < numListings; i++) {
      assertEq(
        listingIDs[i],
        LibListing.get(components, listings[i].npcIndex, listings[i].itemIndex)
      );

      // NOTE: this fails with an inexplicable OutOfGas error...
      // assertEq(0, LibListing.get(components, 2, listings[i].itemIndex));
    }

    // check that listings cannot be created for nonexistent npcs
    numListings = 4;
    TestListingData[] memory invalidNPCListings = new TestListingData[](numListings);
    invalidNPCListings[0] = TestListingData(3, 1, 100, 50);
    invalidNPCListings[1] = TestListingData(3, 2, 80, 40);
    invalidNPCListings[2] = TestListingData(3, 3, 60, 30);
    invalidNPCListings[3] = TestListingData(3, 4, 40, 20);

    for (uint i = 0; i < numListings; i++) {
      vm.prank(deployer);
      vm.expectRevert("NPC: does not exist");
      __ListingSetSystem.executeTyped(
        invalidNPCListings[i].npcIndex,
        invalidNPCListings[i].itemIndex,
        invalidNPCListings[i].priceBuy,
        invalidNPCListings[i].priceSell
      );
    }

    // check that listings cannot be created for nonexistent items
    numListings = 4;
    TestListingData[] memory invalidItemListings = new TestListingData[](numListings);
    invalidItemListings[0] = TestListingData(1, 5, 100, 50);
    invalidItemListings[1] = TestListingData(1, 5, 80, 40);
    invalidItemListings[2] = TestListingData(1, 5, 60, 30);
    invalidItemListings[3] = TestListingData(1, 5, 40, 20);

    for (uint i = 0; i < numListings; i++) {
      vm.prank(deployer);
      vm.expectRevert("Item: does not exist");
      __ListingSetSystem.executeTyped(
        invalidItemListings[i].npcIndex,
        invalidItemListings[i].itemIndex,
        invalidItemListings[i].priceBuy,
        invalidItemListings[i].priceSell
      );
    }
  }

  function testListingInteractionConstraints() public {
    // create two npcs
    _createNPC(1, 1, "npc1");
    _createNPC(2, 2, "npc2");

    // create listings for both npcs
    uint numListings = 4;
    TestListingData[] memory listings1 = new TestListingData[](numListings);
    listings1[0] = TestListingData(1, 1, 80, 40);
    listings1[1] = TestListingData(1, 2, 60, 30);
    listings1[2] = TestListingData(1, 3, 40, 20);
    listings1[3] = TestListingData(1, 4, 20, 10);

    TestListingData[] memory listings2 = new TestListingData[](numListings);
    listings2[0] = TestListingData(2, 1, 80, 40);
    listings2[1] = TestListingData(2, 2, 60, 30);
    listings2[2] = TestListingData(2, 3, 40, 20);
    listings2[3] = TestListingData(2, 4, 20, 10);

    uint[] memory listingIDs1 = new uint[](numListings);
    uint[] memory listingIDs2 = new uint[](numListings);
    for (uint i = 0; i < numListings; i++) {
      listingIDs1[i] = _setListing(
        listings1[i].npcIndex,
        listings1[i].itemIndex,
        listings1[i].priceBuy,
        listings1[i].priceSell
      );
      listingIDs2[i] = _setListing(
        listings2[i].npcIndex,
        listings2[i].itemIndex,
        listings2[i].priceBuy,
        listings2[i].priceSell
      );
    }

    // register and fund accounts. all accounts start in room 1
    uint numAccounts = 5;
    for (uint i = 0; i < numAccounts; i++) {
      _registerAccount(i);
      _fundAccount(i, 1e5);
    }

    // test that players cannot interact with their Owner wallets
    for (uint i = 0; i < numAccounts; i++) {
      for (uint j = 0; j < numListings; j++) {
        vm.prank(_getOwner(i));
        vm.expectRevert("Account: not found");
        _ListingBuySystem.executeTyped(listingIDs1[j], 0);

        vm.prank(_getOwner(i));
        vm.expectRevert("Account: not found");
        _ListingSellSystem.executeTyped(listingIDs1[j], 0);
      }
    }

    // from room 1
    // test that players CAN interact with npc 1 listings
    // test that players CANNOT interact with npc 2 listings
    for (uint i = 0; i < numAccounts; i++) {
      for (uint j = 0; j < numListings; j++) {
        uint amt = j + 1;
        _buyFromListing(i, listingIDs1[j], amt);
        _sellToListing(i, listingIDs1[j], amt);

        vm.prank(_getOperator(i));
        vm.expectRevert("Listing.Buy(): must be in same room as npc");
        _ListingBuySystem.executeTyped(listingIDs2[j], amt);

        vm.prank(_getOperator(i));
        vm.expectRevert("Listing.Sell(): must be in same room as npc");
        _ListingSellSystem.executeTyped(listingIDs2[j], amt);
      }
    }

    // move all accounts to room 2
    for (uint i = 0; i < numAccounts; i++) {
      _moveAccount(i, 2);
    }

    // from room 2
    // test that players CANNOT interact with npc 1 listings
    // test that players CAN interact with npc 2 listings
    for (uint i = 0; i < numAccounts; i++) {
      for (uint j = 0; j < numListings; j++) {
        uint amt = j + 1;
        vm.prank(_getOperator(i));
        vm.expectRevert("Listing.Buy(): must be in same room as npc");
        _ListingBuySystem.executeTyped(listingIDs1[j], amt);

        vm.prank(_getOperator(i));
        vm.expectRevert("Listing.Sell(): must be in same room as npc");
        _ListingSellSystem.executeTyped(listingIDs1[j], amt);

        _buyFromListing(i, listingIDs2[j], amt);
        _sellToListing(i, listingIDs2[j], amt);
      }
    }
  }

  // we're using this one to save on stack space
  struct BalanceTestData {
    uint8 numNPCs;
    uint8 numItems;
    uint8 numAccounts;
    uint8 playerIndex;
    uint8 itemIndex;
    uint24 buyPrice;
    uint24 sellPrice;
    uint24 stockInitial;
    uint24 stockChange;
    uint24 balanceInitial;
    uint24 balanceChange;
  }

  function testListingInteractionBalances() public {
    BalanceTestData memory testData = BalanceTestData(3, 4, 3, 0, 0, 0, 0, 0, 0, 0, 0);

    // create the npc and its listings
    uint[] memory listingIDs = new uint[](testData.numNPCs * testData.numItems);
    for (uint32 i = 0; i < testData.numNPCs; i++) {
      _createNPC(i, 1, "npc");

      for (uint j = 0; j < testData.numItems; j++) {
        testData.buyPrice = uint16(10 * (i + 3 * (j + 1))); // 20, 40, 60, 80 baseline, premium depending on npc
        listingIDs[i * testData.numItems + j] = _setListing(
          i,
          j + 1,
          testData.buyPrice,
          testData.buyPrice / 2
        );
      }
    }

    // register and fund accounts to varying degrees. all accounts start in room 1
    for (uint i = 0; i < testData.numAccounts; i++) {
      _registerAccount(i);
      _fundAccount(i, (i + 1) * 1e4);

      // the below is used to circumvent a gas prediction issue that
      // foundry seems to have when the inventories aren't populated
      for (uint j = 0; j < listingIDs.length; j++) {
        vm.prank(_getOperator(i));
        _ListingBuySystem.executeTyped(listingIDs[j], 1);
      }
    }

    // test that players can buy and sell from listings and that balances are
    // updated accordingly. tx should revert when funds are insufficient
    uint randN;
    uint listingID = 1;
    uint numIterations = 50;
    for (uint i = 0; i < numIterations; i++) {
      randN = uint(keccak256(abi.encode(randN ^ (randN >> (1 << 7)))));
      listingID = listingIDs[randN % listingIDs.length];
      testData.playerIndex = uint8(randN % testData.numAccounts);
      testData.itemIndex = uint8(LibListing.getItemIndex(components, listingID));
      testData.stockInitial = uint24(_getItemBalance(testData.playerIndex, testData.itemIndex)); // item balance
      testData.stockChange = uint24((randN % 100) + 1); // 1-100
      testData.balanceInitial = uint24(_getAccountBalance(testData.playerIndex)); // $MUSU balance

      if (i % 2 == 0) {
        // buy case
        testData.buyPrice = uint24(LibListing.getBuyPrice(components, listingID));
        testData.balanceChange = testData.stockChange * testData.buyPrice;
        if (testData.balanceChange > _getAccountBalance(testData.playerIndex)) {
          vm.prank(_getOperator(testData.playerIndex));
          vm.expectRevert("Coin: insufficient balance");
          _ListingBuySystem.executeTyped(listingID, testData.stockChange);
        } else {
          _buyFromListing(testData.playerIndex, listingID, testData.stockChange);
          assertEq(
            _getAccountBalance(testData.playerIndex),
            testData.balanceInitial - testData.balanceChange
          );
          assertEq(
            _getItemBalance(testData.playerIndex, testData.itemIndex),
            testData.stockInitial + testData.stockChange
          );
        }
      } else {
        // sell case
        testData.sellPrice = uint24(LibListing.getSellPrice(components, listingID));
        testData.balanceChange = testData.stockChange * testData.sellPrice;
        if (testData.stockChange > _getItemBalance(testData.playerIndex, testData.itemIndex)) {
          vm.prank(_getOperator(testData.playerIndex));
          vm.expectRevert("Inventory: insufficient balance");
          _ListingSellSystem.executeTyped(listingID, testData.stockChange);
        } else {
          _sellToListing(testData.playerIndex, listingID, testData.stockChange);
          assertEq(
            _getAccountBalance(testData.playerIndex),
            testData.balanceInitial + testData.balanceChange
          );
          assertEq(
            _getItemBalance(testData.playerIndex, testData.itemIndex),
            testData.stockInitial - testData.stockChange
          );
        }
      }
    }
  }
}
