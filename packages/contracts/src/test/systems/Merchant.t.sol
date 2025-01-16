// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract NPCTest is SetupTemplate {
  // structure of Listing data for test purposes
  struct TestListingData {
    uint32 npcIndex;
    uint32 itemIndex;
    uint priceBuy;
    uint priceSell;
  }

  function setUp() public override {
    super.setUp();
  }

  function setUpItems() public override {
    _createGenericItem(100);
    _createGenericItem(101);
    _createGenericItem(102);
    _createGenericItem(103);
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
      __NPCRegistrySystem.create(abi.encode(1, "testNPC", 2));

      vm.prank(_getOperator(0));
      vm.expectRevert();
      __NPCRegistrySystem.create(abi.encode(2, "testNPC", 1));
    }

    // create a npc and ensure its fields are correct
    uint32 npcIndex1 = 1;
    uint32 npcRoomIndex1 = 3;
    string memory npcName1 = "testNPC";
    uint npcID1 = _createNPC(npcIndex1, npcRoomIndex1, npcName1);
    assertEq(npcIndex1, LibNPC.getIndex(components, npcID1));
    assertEq(npcRoomIndex1, LibNPC.getRoom(components, npcID1));
    assertEq(npcName1, LibNPC.getName(components, npcID1));

    // test that we can't create a npc with the same index
    vm.expectRevert("NPC: already exists");
    vm.prank(deployer);
    __NPCRegistrySystem.create(abi.encode(1, "testNPC", 3)); // index, name, roomIndex

    // but that we CAN create npc with the same name and roomIndex
    uint32 npcIndex2 = 2;
    uint32 npcRoomIndex2 = 3;
    string memory npcName2 = "testNPC";
    uint npcID2 = _createNPC(npcIndex2, npcRoomIndex2, npcName2);
    assertEq(npcIndex2, LibNPC.getIndex(components, npcID2));
    assertEq(npcRoomIndex2, LibNPC.getRoom(components, npcID2));
    assertEq(npcName2, LibNPC.getName(components, npcID2));
    // assertNotEq(npcID1, npcID2); // not available in this version of foundry

    // NOTE: we now have two npcs, named 'testNPC' at roomIndex 3

    // update fields on npc2 and check that both are correct
    uint32 newNPCRoomIndex = 2;
    string memory newNPCName = "newNPCName";
    vm.prank(deployer);
    __NPCRegistrySystem.setRoom(2, newNPCRoomIndex);
    vm.prank(deployer);
    __NPCRegistrySystem.setName(2, newNPCName);

    assertEq(npcIndex1, LibNPC.getIndex(components, npcID1));
    assertEq(npcRoomIndex1, LibNPC.getRoom(components, npcID1));
    assertEq(npcName1, LibNPC.getName(components, npcID1));

    assertEq(npcIndex2, LibNPC.getIndex(components, npcID2));
    assertEq(newNPCRoomIndex, LibNPC.getRoom(components, npcID2));
    assertEq(newNPCName, LibNPC.getName(components, npcID2));

    // test that we can't update a npc that doesnt exist
    vm.prank(deployer);
    vm.expectRevert("NPC: does not exist");
    __NPCRegistrySystem.setRoom(3, newNPCRoomIndex);

    vm.prank(deployer);
    vm.expectRevert("NPC: does not exist");
    __NPCRegistrySystem.setName(4, newNPCName);

    // test that we can't update a npc's attributes as a random address
    for (uint i = 0; i < 5; i++) {
      vm.startPrank(_getOwner(i));
      vm.expectRevert();
      __NPCRegistrySystem.setRoom(1, newNPCRoomIndex);

      vm.expectRevert();
      __NPCRegistrySystem.setName(1, newNPCName);

      vm.expectRevert();
      __NPCRegistrySystem.setRoom(2, newNPCRoomIndex);

      vm.expectRevert();
      __NPCRegistrySystem.setName(2, newNPCName);

      vm.stopPrank();
    }
  }

  function testListingInteractionConstraints() public {
    // create two npcs
    _createNPC(1, 1, "npc1");
    _createNPC(2, 2, "npc2");

    // create listings for both npcs
    uint numListings = 4;
    TestListingData[] memory listings1 = new TestListingData[](numListings);
    listings1[0] = TestListingData(1, 100, 80, 40);
    listings1[1] = TestListingData(1, 101, 60, 30);
    listings1[2] = TestListingData(1, 102, 40, 20);
    listings1[3] = TestListingData(1, 103, 20, 10);

    TestListingData[] memory listings2 = new TestListingData[](numListings);
    listings2[0] = TestListingData(2, 100, 80, 40);
    listings2[1] = TestListingData(2, 101, 60, 30);
    listings2[2] = TestListingData(2, 102, 40, 20);
    listings2[3] = TestListingData(2, 103, 20, 10);

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

    // from room 1
    // test that players CAN interact with npc 1 listings
    // test that players CANNOT interact with npc 2 listings
    for (uint i = 0; i < numAccounts; i++) {
      for (uint j = 0; j < numListings; j++) {
        uint amt = j + 1;
        _buyFromListing(i, listingIDs1[j], amt);
        _sellToListing(i, listingIDs1[j], amt);

        uint32[] memory itemIndices = new uint32[](1);
        itemIndices[0] = listings2[j].itemIndex;
        uint32[] memory amts = new uint32[](1);
        amts[0] = uint32(amt);

        vm.prank(_getOperator(i));
        vm.expectRevert("must be in same room as npc");
        _ListingBuySystem.executeTyped(listings2[j].npcIndex, itemIndices, amts);

        vm.prank(_getOperator(i));
        vm.expectRevert("must be in same room as npc");
        _ListingSellSystem.executeTyped(listings2[j].npcIndex, itemIndices, amts);
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
        uint32[] memory itemIndices = new uint32[](1);
        itemIndices[0] = listings1[j].itemIndex;
        uint32[] memory amts = new uint32[](1);
        amts[0] = uint32(amt);

        vm.prank(_getOperator(i));
        vm.expectRevert("must be in same room as npc");
        _ListingBuySystem.executeTyped(listings1[j].npcIndex, itemIndices, amts);

        vm.prank(_getOperator(i));
        vm.expectRevert("must be in same room as npc");
        _ListingSellSystem.executeTyped(listings1[j].npcIndex, itemIndices, amts);

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
    TestListingData[] memory listings = new TestListingData[](testData.numNPCs * testData.numItems);
    uint[] memory listingIDs = new uint[](testData.numNPCs * testData.numItems);
    for (uint32 i = 0; i < testData.numNPCs; i++) {
      _createNPC(i, 1, "npc");

      for (uint j = 0; j < testData.numItems; j++) {
        testData.buyPrice = uint16(10 * (i + 3 * (j + 1))); // 20, 40, 60, 80 baseline, premium depending on npc
        listingIDs[i * testData.numItems + j] = _setListing(
          i,
          uint32(j + 100),
          testData.buyPrice,
          testData.buyPrice / 2
        );
        listings[i * testData.numItems + j] = TestListingData(
          i,
          uint32(j + 100),
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
        uint32[] memory itemIndices = new uint32[](1);
        itemIndices[0] = listings[j].itemIndex;
        uint32[] memory amts = new uint32[](1);
        amts[0] = uint32(1);

        vm.prank(_getOperator(i));
        _ListingBuySystem.executeTyped(listings[j].npcIndex, itemIndices, amts);
      }
    }

    // test that players can buy and sell from listings and that balances are
    // updated accordingly. tx should revert when funds are insufficient
    uint randN;
    uint listingID = 1;
    TestListingData memory listing;
    uint numIterations = 50;
    for (uint i = 0; i < numIterations; i++) {
      randN = uint(keccak256(abi.encode(randN ^ (randN >> (1 << 7)))));
      listingID = listingIDs[randN % listingIDs.length];
      listing = listings[randN % listings.length];
      testData.playerIndex = uint8(randN % testData.numAccounts);
      testData.itemIndex = uint8(_IndexItemComponent.get(listingID));
      testData.stockInitial = uint24(_getItemBal(testData.playerIndex, testData.itemIndex)); // item balance
      testData.stockChange = uint24((randN % 100) + 1); // 1-100
      testData.balanceInitial = uint24(_getAccountBalance(testData.playerIndex)); // $MUSU balance

      if (i % 2 == 0) {
        // buy case
        testData.buyPrice = uint24(LibListing.calcBuyPrice(components, listingID, 1));
        testData.balanceChange = testData.stockChange * testData.buyPrice;
        if (testData.balanceChange > _getAccountBalance(testData.playerIndex)) {
          uint32[] memory itemIndices = new uint32[](1);
          itemIndices[0] = listing.itemIndex;
          uint32[] memory amts = new uint32[](1);
          amts[0] = uint32(uint256(testData.stockChange));

          vm.prank(_getOperator(testData.playerIndex));
          // vm.expectRevert("Inventory: insufficient balance");
          vm.expectRevert();
          _ListingBuySystem.executeTyped(listing.npcIndex, itemIndices, amts);
        } else {
          _buyFromListing(testData.playerIndex, listingID, testData.stockChange);
          assertEq(
            _getAccountBalance(testData.playerIndex),
            testData.balanceInitial - testData.balanceChange
          );
          assertEq(
            _getItemBal(testData.playerIndex, testData.itemIndex),
            testData.stockInitial + testData.stockChange
          );
        }
      } else {
        // sell case
        testData.sellPrice = uint24(LibListing.calcSellPrice(components, listingID, 1));
        testData.balanceChange = testData.stockChange * testData.sellPrice;
        if (testData.stockChange > _getItemBal(testData.playerIndex, testData.itemIndex)) {
          uint32[] memory itemIndices = new uint32[](1);
          itemIndices[0] = listing.itemIndex;
          uint32[] memory amts = new uint32[](1);
          amts[0] = uint32(uint256(testData.stockChange));

          vm.prank(_getOperator(testData.playerIndex));
          // vm.expectRevert("Inventory: insufficient balance");
          vm.expectRevert();
          _ListingSellSystem.executeTyped(listing.npcIndex, itemIndices, amts);
        } else {
          _sellToListing(testData.playerIndex, listingID, testData.stockChange);
          assertEq(
            _getAccountBalance(testData.playerIndex),
            testData.balanceInitial + testData.balanceChange
          );
          assertEq(
            _getItemBal(testData.playerIndex, testData.itemIndex),
            testData.stockInitial - testData.stockChange
          );
        }
      }
    }
  }
}
