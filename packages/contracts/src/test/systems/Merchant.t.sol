// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";

import "test/utils/SetupTemplate.s.sol";

contract MerchantTest is SetupTemplate {
  // structure of Merchant data for test purposes
  struct TestMerchantData {
    uint256 index;
    uint256 location;
    string name;
  }

  // structure of Listing data for test purposes
  struct TestListingData {
    uint256 merchantIndex;
    uint256 itemIndex;
    uint256 priceBuy;
    uint256 priceSell;
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
  // HELPER FUNCTIONS

  function _createMerchant(
    uint256 index,
    uint256 location,
    string memory name
  ) public returns (uint256) {
    vm.prank(deployer);
    return abi.decode(__MerchantCreateSystem.executeTyped(index, name, location), (uint256));
  }

  function _setListing(
    uint256 index,
    uint256 itemId,
    uint256 priceBuy,
    uint256 priceSell
  ) public returns (uint256) {
    vm.prank(deployer);
    return
      abi.decode(__ListingSetSystem.executeTyped(index, itemId, priceBuy, priceSell), (uint256));
  }

  function _buyFromListing(uint256 playerIndex, uint256 listingID, uint256 amount) internal {
    vm.prank(_getOperator(playerIndex));
    _ListingBuySystem.executeTyped(listingID, amount);
  }

  function _sellToListing(uint256 playerIndex, uint256 listingID, uint256 amount) internal {
    vm.prank(_getOperator(playerIndex));
    _ListingSellSystem.executeTyped(listingID, amount);
  }

  function _getItemBalance(uint256 playerIndex, uint256 itemIndex) internal view returns (uint256) {
    uint256 accountID = _getAccount(playerIndex);
    console.log("playerIndex: %s", playerIndex);
    console.log("itemIndex: %s", itemIndex);
    console.log("accountID: %s", accountID);
    // uint256 inventoryID = LibInventory.get(components, accountID, itemIndex);
    // return LibInventory.getBalance(components, inventoryID);
    return 2;
  }

  // test the creation of a merchant and the setting of its fields
  function testMerchantCreation() public {
    // check that non-deployer cannot create a merchant
    for (uint256 i = 0; i < 5; i++) {
      vm.prank(_getOwner(0));
      vm.expectRevert();
      __MerchantCreateSystem.executeTyped(1, "testMerchant", 2);

      vm.prank(_getOperator(0));
      vm.expectRevert();
      __MerchantCreateSystem.executeTyped(2, "testMerchant", 1);
    }

    // create a merchant and ensure its fields are correct
    uint256 merchantIndex1 = 1;
    uint256 merchantLocation1 = 3;
    string memory merchantName1 = "testMerchant";
    uint256 merchantID1 = _createMerchant(merchantIndex1, merchantLocation1, merchantName1);
    assertEq(merchantIndex1, LibMerchant.getIndex(components, merchantID1));
    assertEq(merchantLocation1, LibMerchant.getLocation(components, merchantID1));
    assertEq(merchantName1, LibMerchant.getName(components, merchantID1));

    // test that we can't create a merchant with the same index
    vm.expectRevert("Merchant: already exists");
    vm.prank(deployer);
    __MerchantCreateSystem.executeTyped(1, "testMerchant", 3); // index, name, location

    // but that we CAN create merchant with the same name and location
    uint256 merchantIndex2 = 2;
    uint256 merchantLocation2 = 3;
    string memory merchantName2 = "testMerchant";
    uint256 merchantID2 = _createMerchant(merchantIndex2, merchantLocation2, merchantName2);
    assertEq(merchantIndex2, LibMerchant.getIndex(components, merchantID2));
    assertEq(merchantLocation2, LibMerchant.getLocation(components, merchantID2));
    assertEq(merchantName2, LibMerchant.getName(components, merchantID2));
    // assertNotEq(merchantID1, merchantID2); // not available in this version of foundry

    // NOTE: we now have two merchants, named 'testMerchant' at location 3

    // update fields on merchant2 and check that both are correct
    uint256 newMerchantLocation = 2;
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
    for (uint256 i = 0; i < 5; i++) {
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
    for (uint256 i = 0; i < 5; i++) {
      vm.prank(_getOwner(0));
      vm.expectRevert();
      __ListingSetSystem.executeTyped(1, 1, 50, 50);

      vm.prank(_getOperator(0));
      vm.expectRevert();
      __ListingSetSystem.executeTyped(2, 2, 50, 50);
    }

    // initial creation, check that item/merchant indices and prices are correct
    uint256 numListings = 4;
    TestListingData[] memory listings = new TestListingData[](numListings);
    listings[0] = TestListingData(1, 1, 100, 50);
    listings[1] = TestListingData(1, 2, 80, 40);
    listings[2] = TestListingData(1, 3, 60, 30);
    listings[3] = TestListingData(1, 4, 40, 20);

    uint256[] memory listingIDs = new uint256[](numListings);
    for (uint256 i = 0; i < numListings; i++) {
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

    uint256 newListingID;
    for (uint256 i = 0; i < numListings; i++) {
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
    for (uint256 i = 0; i < numListings; i++) {
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

    for (uint256 i = 0; i < numListings; i++) {
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

    for (uint256 i = 0; i < numListings; i++) {
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
    uint256 numListings = 4;
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

    uint256[] memory listingIDs1 = new uint256[](numListings);
    uint256[] memory listingIDs2 = new uint256[](numListings);
    for (uint256 i = 0; i < numListings; i++) {
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
    uint256 numAccounts = 5;
    for (uint256 i = 0; i < numAccounts; i++) {
      _registerAccount(i);
      _fundAccount(i, 1e5);
    }

    // test that players cannot interact with their Owner wallets
    for (uint256 i = 0; i < numAccounts; i++) {
      for (uint256 j = 0; j < numListings; j++) {
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
    for (uint256 i = 0; i < numAccounts; i++) {
      for (uint256 j = 0; j < numListings; j++) {
        uint256 amt = j + 1;
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
    for (uint256 i = 0; i < numAccounts; i++) {
      _moveAccount(i, 2);
    }

    // from room 2
    // test that players CANNOT interact with merchant 1 listings
    // test that players CAN interact with merchant 2 listings
    for (uint256 i = 0; i < numAccounts; i++) {
      for (uint256 j = 0; j < numListings; j++) {
        uint256 amt = j + 1;
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

  // this time we're using this one to save gas..
  struct BalanceTestData {
    uint16 numIterations;
    uint8 numMerchants;
    uint8 numItems;
    uint8 numAccounts;
    uint8 playerIndex;
    uint8 itemIndex;
    uint16 buyPrice;
    uint16 sellPrice;
    uint16 stockInitial;
    uint16 stockChange;
    uint24 balanceInitial;
    uint24 balanceChange;
  }
}
