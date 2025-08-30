// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { LibListingRegistry } from "libraries/LibListingRegistry.sol";

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

  // function setUpAccounts() public override {
  //   _createOwnerOperatorPairs(25);
  // }

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

  // todo: prices are hardcoded, to update to curved
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
      listingIDs1[i] = _createListing(
        listings1[i].npcIndex,
        listings1[i].itemIndex,
        1,
        listings1[i].priceBuy
      );
      _setListingBuyFixed(listings1[i].npcIndex, listings1[i].itemIndex); // using musu for currency
      _setListingSellScaled(listings1[i].npcIndex, listings1[i].itemIndex, 5e8); // half price
      listingIDs2[i] = _createListing(
        listings2[i].npcIndex,
        listings2[i].itemIndex,
        1,
        listings2[i].priceBuy
      );
      _setListingBuyFixed(listings2[i].npcIndex, listings2[i].itemIndex);
      _setListingSellScaled(listings2[i].npcIndex, listings2[i].itemIndex, 5e8); // half price
    }

    // register and fund accounts. all accounts start in room 1
    uint numAccounts = 5;
    for (uint i = 0; i < numAccounts; i++) {
      // _registerAccount(i);
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

  function testListingBasicBuy() public {
    // setup
    uint32 item = 100;
    uint256 price = 100;
    _createNPC(1, 1, "npc1");
    _createListing(1, item, 1, price);
    _setListingBuyFixed(1, item);
    _giveItem(alice, 1, price);

    // pre-buy
    assertEq(_getItemBal(alice, item), 0);
    assertEq(_getItemBal(alice, 1), 100);

    // buy
    _buy(alice, 1, item, 1);

    // post-buy
    assertEq(_getItemBal(alice, item), 1);
    assertEq(_getItemBal(alice, 1), 0);
  }

  function testListingCurrencyBuy() public {
    // setup
    address tokenAddr = _createERC20("name", "symbol");
    uint32 item = 100;
    uint32 currency = 7; // item currency
    _createGenericItem(item);
    _createGenericItem(currency);
    uint256 price = 100;
    _createNPC(1, 1, "npc1");
    _createListing(1, item, currency, price);
    _setListingBuyFixed(1, item);
    _giveItem(alice, currency, price);

    // pre-buy
    assertEq(_getItemBal(alice, item), 0);
    assertEq(_getItemBal(alice, currency), 100);

    // buy
    _buy(alice, 1, item, 1);

    // post-buy
    assertEq(_getItemBal(alice, item), 1);
    assertEq(_getItemBal(alice, currency), 0);
  }

  // function testGDABasic() public {
  //   // setup
  //   uint32 item = 100;
  //   uint256 startPrice = 100;
  //   _createNPC(1, 1, "npc1");
  //   _createListing(1, item, 1, startPrice);
  //   _setListingBuyGDA(1, item, 60, 1002776250, 8022); // expected starting startPrice 100
  //   _giveItem(alice, 1, startPrice);

  //   // pre-buy
  //   assertEq(_getItemBal(alice, item), 0);
  //   assertEq(_getItemBal(alice, 1), 100);

  //   // buy 1 at start price
  //   _buy(alice, 1, item, 1);
  //   assertEq(_getItemBal(alice, item), 1);
  //   assertEq(_getItemBal(alice, 1), 0);

  //   // buying many more (not checking calcs)
  //   _giveItem(alice, 1, 9999999999);
  //   _buy(alice, 1, item, 25);
  //   for (uint i = 0; i < 25; i++) {
  //     _fastForward(100);
  //     _buy(alice, 1, item, 1);
  //   }
  //   for (uint i = 0; i < 25; i++) _buy(alice, 1, item, 3);
  // }

  // function testGDABounds(
  //   uint256 basePrice,
  //   uint32 scale, // 1e9 (lim infinite items)- 2e9 (1 item)
  //   uint32 decay //  1 (max time)- 69314718 (1s)
  // ) public {
  //   if (scale > 0) scale = (scale % 1e9) + 1e9; // prevent too many rejects
  //   vm.assume(scale >= 1e9 && scale <= 2e9);
  //   if (decay > 0) decay = (decay % 69314718) + 1; // prevent too many rejects
  //   vm.assume(decay >= 1 && decay <= 69314718);
  //   vm.assume(basePrice > 0);
  //   if (basePrice > 1e30) basePrice = 1e30; // prevent too many rejects
  //   vm.assume(basePrice <= 1e30); // support up to 1e12 ERC20 (with 18 decimals)

  //   // setup
  //   uint32 item = 100;
  //   uint256 startPrice = 100;
  //   _createNPC(1, 1, "npc1");
  //   _createListing(1, item, 1, basePrice);
  //   _setListingBuyGDA(1, item, 60, int32(scale), int32(decay));
  //   _giveItem(alice, 1, 2 ** 256 - 1); // give max uint

  //   // buy one
  //   _buy(alice, 1, item, 1);
  // }

  /////////////////
  // UTILS

  function _buy(
    PlayerAccount memory player,
    uint32 npcIndex,
    uint32 itemIndex,
    uint amount
  ) internal {
    uint32[] memory itemIndices = new uint32[](1);
    itemIndices[0] = itemIndex;
    uint32[] memory amts = new uint32[](1);
    amts[0] = uint32(amount);

    vm.prank(player.operator);
    _ListingBuySystem.executeTyped(npcIndex, itemIndices, amts);
  }

  function _createListing(
    uint32 npcIndex,
    uint32 itemIndex,
    uint32 currency,
    uint basePrice
  ) internal returns (uint) {
    vm.prank(deployer);
    return __ListingRegistrySystem.create(abi.encode(npcIndex, itemIndex, currency, basePrice));
  }

  function _setListingBuyFixed(uint32 npcIndex, uint32 itemIndex) internal {
    vm.prank(deployer);
    return __ListingRegistrySystem.setBuyFixed(npcIndex, itemIndex);
  }

  function _setListingBuyGDA(
    uint32 npcIndex,
    uint32 itemIndex,
    int32 period,
    int32 scale,
    int32 decay
  ) internal {
    vm.prank(deployer);
    return __ListingRegistrySystem.setBuyGDA(npcIndex, itemIndex, period, scale, decay, false);
  }

  function _setListingSellFixed(uint32 npcIndex, uint32 itemIndex) internal {
    vm.prank(deployer);
    return __ListingRegistrySystem.setSellFixed(npcIndex, itemIndex);
  }

  function _setListingSellScaled(uint32 npcIndex, uint32 itemIndex, int32 scale) internal {
    vm.prank(deployer);
    return __ListingRegistrySystem.setSellScaled(npcIndex, itemIndex, scale);
  }
}
