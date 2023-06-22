// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

import { KamiERC20 } from "tokens/KamiERC20.sol";

contract MerchantTest is SetupTemplate {
  KamiERC20 token;

  function setUp() public override {
    super.setUp();
    token = _ERC20ProxySystem.getToken();

    // create rooms
    _createRoom("testRoom1", 1, 2, 3, 0);
    _createRoom("testRoom2", 2, 1, 3, 0);
    _createRoom("testRoom3", 3, 1, 2, 0);

    // register and fund accounts
    _registerAccount(0);
    _registerAccount(1);
    _fundAccount(0, 1e5);
    _fundAccount(1, 1e5);

    _initItems();
    // 1. gum    = 25  heal
    // 2. candy  = 100 heal
    // 3. sticks = 200 heal
    // 4. ribbon = 10  heal, revive

    // create merchant and add items
    // add items to merchant
  }

  function _createMerchant(
    uint256 index,
    uint256 location,
    string memory name
  ) public returns (uint256) {
    vm.prank(deployer);
    bytes memory encodedMerchantID = __MerchantCreateSystem.executeTyped(index, name, location);
    return abi.decode(encodedMerchantID, (uint256));
  }

  function _setListing(
    uint256 index,
    uint256 itemId,
    uint256 priceBuy,
    uint256 priceSell
  ) public returns (uint256) {
    vm.prank(deployer);
    bytes memory encodedListingID = __ListingSetSystem.executeTyped(
      index,
      itemId,
      priceBuy,
      priceSell
    );
    return abi.decode(encodedListingID, (uint256));
  }

  // test the creation of a merchant and the setting of its fields
  function testCreateMerchant() public {
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

  struct TestListingData {
    uint256 merchantIndex;
    uint256 itemIndex;
    uint256 priceBuy;
    uint256 priceSell;
  }

  // test the creation of a listing and the setting of its fields
  // listings work differently than merchants in that:
  // - they don't have an index unto themselves
  // - a listing is identified by MerchantIndex and ItemIndex
  // - there is a single EP for both creating and updating a listing
  // - whether a listing is created or updated is autodetected based on its existence
  function testSetListings() public {
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
}
