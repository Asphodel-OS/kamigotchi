// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract MerchantTest is SetupTemplate {
  // structure of Listing data for test purposes
  struct TestListingData {
    uint merchantIndex;
    uint itemIndex;
    uint priceBuy;
    uint priceSell;
  }

  function setUp() public override {
    super.setUp();

    // create rooms
    _createRoom("testRoom1", 1, 2, 3, 0);
    _createRoom("testRoom2", 2, 1, 3, 0);
    _createRoom("testRoom3", 3, 1, 2, 0);

    _initItems();
    // 1. gum    = 25  heal
    // 2. candy  = 100 heal
    // 3. sticks = 200 heal
    // 4. ribbon = 10  heal, revive
  }

  /////////////////
  // TESTS

  // test the creation of a merchant and the setting of its fields
  function testMerchantCreation() public {
    // check that non-deployer cannot create a merchant
    for (uint i = 0; i < 5; i++) {
      vm.prank(_getOwner(0));
      vm.expectRevert();
      __MerchantCreateSystem.executeTyped(1, "testMerchant", 2);

      vm.prank(_getOperator(0));
      vm.expectRevert();
      __MerchantCreateSystem.executeTyped(2, "testMerchant", 1);
    }

    // create a merchant and ensure its fields are correct
    uint merchantIndex1 = 1;
    uint merchantLocation1 = 3;
    string memory merchantName1 = "testMerchant";
    uint merchantID1 = _createMerchant(merchantIndex1, merchantLocation1, merchantName1);
    assertEq(merchantIndex1, LibMerchant.getIndex(components, merchantID1));
    assertEq(merchantLocation1, LibMerchant.getLocation(components, merchantID1));
    assertEq(merchantName1, LibMerchant.getName(components, merchantID1));

    // test that we can't create a merchant with the same index
    vm.expectRevert("Merchant: already exists");
    vm.prank(deployer);
    __MerchantCreateSystem.executeTyped(1, "testMerchant", 3); // index, name, location

    // but that we CAN create merchant with the same name and location
    uint merchantIndex2 = 2;
    uint merchantLocation2 = 3;
    string memory merchantName2 = "testMerchant";
    uint merchantID2 = _createMerchant(merchantIndex2, merchantLocation2, merchantName2);
    assertEq(merchantIndex2, LibMerchant.getIndex(components, merchantID2));
    assertEq(merchantLocation2, LibMerchant.getLocation(components, merchantID2));
    assertEq(merchantName2, LibMerchant.getName(components, merchantID2));
    // assertNotEq(merchantID1, merchantID2); // not available in this version of foundry

    // NOTE: we now have two merchants, named 'testMerchant' at location 3

    // update fields on merchant2 and check that both are correct
    uint newMerchantLocation = 2;
    string memory newMerchantName = "newMerchantName";
    vm.prank(deployer);
    __MerchantSetLocationSystem.executeTyped(2, newMerchantLocation);
    vm.prank(deployer);
    __MerchantSetNameSystem.executeTyped(2, newMerchantName);

    assertEq(merchantIndex1, LibMerchant.getIndex(components, merchantID1));
    assertEq(merchantLocation1, LibMerchant.getLocation(components, merchantID1));
    assertEq(merchantName1, LibMerchant.getName(components, merchantID1));

    assertEq(merchantIndex2, LibMerchant.getIndex(components, merchantID2));
    assertEq(newMerchantLocation, LibMerchant.getLocation(components, merchantID2));
    assertEq(newMerchantName, LibMerchant.getName(components, merchantID2));

    // test that we can't update a merchant that doesnt exist
    vm.prank(deployer);
    vm.expectRevert("Merchant: does not exist");
    __MerchantSetLocationSystem.executeTyped(3, newMerchantLocation);

    vm.prank(deployer);
    vm.expectRevert("Merchant: does not exist");
    __MerchantSetNameSystem.executeTyped(4, newMerchantName);

    // test that we can't update a merchant's attributes as a random address
    for (uint i = 0; i < 5; i++) {
      vm.startPrank(_getOwner(i));
      vm.expectRevert();
      __MerchantSetLocationSystem.executeTyped(1, newMerchantLocation);

      vm.expectRevert();
      __MerchantSetNameSystem.executeTyped(1, newMerchantName);

      vm.expectRevert();
      __MerchantSetLocationSystem.executeTyped(2, newMerchantLocation);

      vm.expectRevert();
      __MerchantSetNameSystem.executeTyped(2, newMerchantName);

      vm.stopPrank();
    }
  }

  // test the creation of a listing and the setting of its fields
  // listings work differently than merchants in that:
  // - they don't have an index unto themselves
  // - a listing is identified by MerchantIndex and ItemIndex
  // - there is a single EP for both creating and updating a listing
  // - whether a listing is created or updated is autodetected based on its existence
  function testListingSetting() public {
    // create two merchants
    _createMerchant(1, 1, "merchant1");
    _createMerchant(2, 2, "merchant2");

    // check that non deployer cannot create a listing
    for (uint i = 0; i < 5; i++) {
      vm.prank(_getOwner(0));
      vm.expectRevert();
      __ListingSetSystem.executeTyped(1, 1, 50, 50);

      vm.prank(_getOperator(0));
      vm.expectRevert();
      __ListingSetSystem.executeTyped(2, 2, 50, 50);
    }

    // initial creation, check that item/merchant indices and prices are correct
    uint numListings = 4;
    TestListingData[] memory listings = new TestListingData[](numListings);
    listings[0] = TestListingData(1, 1, 100, 50);
    listings[1] = TestListingData(1, 2, 80, 40);
    listings[2] = TestListingData(1, 3, 60, 30);
    listings[3] = TestListingData(1, 4, 40, 20);

    uint[] memory listingIDs = new uint[](numListings);
    for (uint i = 0; i < numListings; i++) {
      listingIDs[i] = _setListing(
        listings[i].merchantIndex,
        listings[i].itemIndex,
        listings[i].priceBuy,
        listings[i].priceSell
      );
      assertEq(listings[i].merchantIndex, LibListing.getMerchantIndex(components, listingIDs[i]));
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
        listings[i].merchantIndex,
        listings[i].itemIndex,
        listings[i].priceBuy,
        listings[i].priceSell
      );
      assertEq(newListingID, listingIDs[i]);
      assertEq(listings[i].merchantIndex, LibListing.getMerchantIndex(components, listingIDs[i]));
      assertEq(listings[i].itemIndex, LibListing.getItemIndex(components, listingIDs[i]));
      assertEq(listings[i].priceBuy, LibListing.getBuyPrice(components, listingIDs[i]));
      assertEq(listings[i].priceSell, LibListing.getSellPrice(components, listingIDs[i]));
    }

    // check that pulling by merchant/item index yields the correct listing, or 0 if none exists
    // NOTE: this is somewhat of a given assumption of the test. but we should still verify
    for (uint i = 0; i < numListings; i++) {
      assertEq(
        listingIDs[i],
        LibListing.get(components, listings[i].merchantIndex, listings[i].itemIndex)
      );
      assertEq(0, LibListing.get(components, 2, listings[i].itemIndex));
    }

    // check that listings cannot be created for nonexistent merchants
    numListings = 4;
    TestListingData[] memory invalidMerchantListings = new TestListingData[](numListings);
    invalidMerchantListings[0] = TestListingData(3, 1, 100, 50);
    invalidMerchantListings[1] = TestListingData(3, 2, 80, 40);
    invalidMerchantListings[2] = TestListingData(3, 3, 60, 30);
    invalidMerchantListings[3] = TestListingData(3, 4, 40, 20);

    for (uint i = 0; i < numListings; i++) {
      vm.prank(deployer);
      vm.expectRevert("Merchant: does not exist");
      __ListingSetSystem.executeTyped(
        invalidMerchantListings[i].merchantIndex,
        invalidMerchantListings[i].itemIndex,
        invalidMerchantListings[i].priceBuy,
        invalidMerchantListings[i].priceSell
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
        invalidItemListings[i].merchantIndex,
        invalidItemListings[i].itemIndex,
        invalidItemListings[i].priceBuy,
        invalidItemListings[i].priceSell
      );
    }
  }

  function testListingInteractionConstraints() public {
    // create two merchants
    _createMerchant(1, 1, "merchant1");
    _createMerchant(2, 2, "merchant2");

    // create listings for both merchants
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
        listings1[i].merchantIndex,
        listings1[i].itemIndex,
        listings1[i].priceBuy,
        listings1[i].priceSell
      );
      listingIDs2[i] = _setListing(
        listings2[i].merchantIndex,
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
    // test that players CAN interact with merchant 1 listings
    // test that players CANNOT interact with merchant 2 listings
    for (uint i = 0; i < numAccounts; i++) {
      for (uint j = 0; j < numListings; j++) {
        uint amt = j + 1;
        _buyFromListing(i, listingIDs1[j], amt);
        _sellToListing(i, listingIDs1[j], amt);

        vm.prank(_getOperator(i));
        vm.expectRevert("Listing.Buy(): must be in same room as merchant");
        _ListingBuySystem.executeTyped(listingIDs2[j], amt);

        vm.prank(_getOperator(i));
        vm.expectRevert("Listing.Sell(): must be in same room as merchant");
        _ListingSellSystem.executeTyped(listingIDs2[j], amt);
      }
    }

    // move all accounts to room 2
    for (uint i = 0; i < numAccounts; i++) {
      _moveAccount(i, 2);
    }

    // from room 2
    // test that players CANNOT interact with merchant 1 listings
    // test that players CAN interact with merchant 2 listings
    for (uint i = 0; i < numAccounts; i++) {
      for (uint j = 0; j < numListings; j++) {
        uint amt = j + 1;
        vm.prank(_getOperator(i));
        vm.expectRevert("Listing.Buy(): must be in same room as merchant");
        _ListingBuySystem.executeTyped(listingIDs1[j], amt);

        vm.prank(_getOperator(i));
        vm.expectRevert("Listing.Sell(): must be in same room as merchant");
        _ListingSellSystem.executeTyped(listingIDs1[j], amt);

        _buyFromListing(i, listingIDs2[j], amt);
        _sellToListing(i, listingIDs2[j], amt);
      }
    }
  }

  // we're using this one to save on stack space
  struct BalanceTestData {
    uint8 numMerchants;
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

    // create the merchant and its listings
    uint[] memory listingIDs = new uint[](testData.numMerchants * testData.numItems);
    for (uint i = 0; i < testData.numMerchants; i++) {
      _createMerchant(i, 1, "merchant");

      for (uint j = 0; j < testData.numItems; j++) {
        testData.buyPrice = uint16(10 * (i + 3 * (j + 1))); // 20, 40, 60, 80 baseline, premium depending on merchant
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
      testData.balanceInitial = uint24(_getAccountBalance(testData.playerIndex)); // $KAMI balance

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
