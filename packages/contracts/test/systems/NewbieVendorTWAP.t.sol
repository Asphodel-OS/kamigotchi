// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";
import { KamiMarketVault } from "tokens/KamiMarketVault.sol";
import { OpenMintable } from "tokens/OpenMintable.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKami721 } from "libraries/LibKami721.sol";

uint256 constant TWAP_ENTITY = uint256(keccak256("newbie.vendor.twap"));
uint256 constant VENDOR_ENTITY = uint256(keccak256("newbie.vendor"));

/// @notice Tests for Newbie Vendor TWAP pricing oracle (fed by marketplace sales)
contract NewbieVendorTWAPTest is SetupTemplate {
  uint256 constant MIN_PRICE = 0.005 ether;
  uint256 constant TWAP_WINDOW = 86400; // 24h
  uint256 constant LIST_PRICE = 0.02 ether;

  KamiMarketVault vault;
  OpenMintable weth;
  address treasury;

  function setUp() public override {
    super.setUp();
    vm.roll(_currBlock++);

    // Deploy mock WETH + vault
    weth = new OpenMintable("Wrapped Ether", "WETH");
    vault = new KamiMarketVault(address(weth), address(LibKami721.getContract(components)), deployer);
    treasury = address(0xFEE);

    vm.startPrank(deployer);

    // Configure TWAP oracle
    __NewbieVendorRegistrySystem.setMinPrice(MIN_PRICE);
    __NewbieVendorRegistrySystem.setTWAPWindow(TWAP_WINDOW);
    __NewbieVendorRegistrySystem.initTWAP(0.01 ether);

    // Configure vendor basics
    __NewbieVendorRegistrySystem.setEnabled(true);
    __NewbieVendorRegistrySystem.setVendorAddress(alice.owner);
    __NewbieVendorRegistrySystem.setCycleDuration(172800);

    // Configure marketplace
    vault.authorizeCaller(address(_KamiMarketAcceptOfferSystem));
    __KamiMarketRegistrySystem.setVault(address(vault));
    __KamiMarketRegistrySystem.setFeeRecipient(treasury);
    __KamiMarketRegistrySystem.setMaxOrders(50);
    __KamiMarketRegistrySystem.setEnabled(true);
    __KamiMarketRegistrySystem.setPurchaseCooldown(3600);

    // Fee rate: 0% for simpler price math in TWAP tests
    uint32[8] memory feeRate;
    feeRate[0] = 4; // precision: 10^4
    feeRate[1] = 0; // numerator: 0%
    __KamiMarketRegistrySystem.setFeeRate(feeRate);

    vm.stopPrank();
  }

  /////////////////
  // HELPERS

  function _createStakedKami(PlayerAccount memory acc) internal returns (uint256 kamiID, uint32 kamiIndex) {
    kamiID = _mintKami(acc);
    kamiIndex = LibKami.getIndex(components, kamiID);
  }

  function _listKami(
    PlayerAccount memory acc,
    uint32 kamiIndex,
    uint256 price
  ) internal returns (uint256 orderID) {
    vm.startPrank(acc.operator);
    orderID = abi.decode(_KamiMarketListSystem.executeTyped(kamiIndex, price, 0), (uint256));
    vm.stopPrank();
  }

  function _buyKami(PlayerAccount memory acc, uint256 listingID, uint256 value) internal {
    uint256[] memory ids = new uint256[](1);
    ids[0] = listingID;
    vm.startPrank(acc.owner);
    _KamiMarketBuySystem.executeTyped{value: value}(ids);
    vm.stopPrank();
  }

  function _setupWETH(PlayerAccount memory acc, uint256 amount) internal {
    weth.mint(acc.owner, amount);
    vm.prank(acc.owner);
    weth.approve(address(vault), type(uint256).max);
  }

  function _offerKami(
    PlayerAccount memory acc,
    uint32 kamiIndex,
    uint256 price
  ) internal returns (uint256 orderID) {
    vm.startPrank(acc.operator);
    orderID = abi.decode(_KamiMarketOfferSystem.executeTypedOffer(kamiIndex, price, 0), (uint256));
    vm.stopPrank();
  }

  function _acceptOffer(PlayerAccount memory acc, uint256 offerID, uint32 kamiIndex) internal {
    vm.startPrank(acc.operator);
    _KamiMarketAcceptOfferSystem.executeTyped(offerID, kamiIndex);
    vm.stopPrank();
  }

  /// @notice Helper: alice's vendor sells a kami to charlie, returns the kami info
  function _vendorBuyAsCharlie() internal returns (uint32 kamiIndex, uint256 kamiID) {
    kamiID = _mintKami(alice);
    kamiIndex = LibKami.getIndex(components, kamiID);

    uint256[] memory pool = new uint256[](1);
    pool[0] = uint256(kamiIndex);
    vm.prank(deployer);
    __NewbieVendorRegistrySystem.setPool(pool);

    vm.deal(charlie.owner, 1 ether);
    vm.prank(charlie.owner);
    _NewbieVendorBuySystem.executeTyped{value: 0.1 ether}(kamiIndex);
  }

  //////////////////
  // TESTS

  function testTWAPInitialization() public view {
    uint256[] memory data = _ValuesComponent.get(TWAP_ENTITY);
    assertEq(data.length, 5);
    assertEq(data[0], 0); // cumulativePriceSeconds
    assertEq(data[1], 0.01 ether); // lastPrice
    assertEq(data[2], block.timestamp); // lastUpdateTime
    assertEq(data[3], 0); // snapshotCumulative
    assertEq(data[4], block.timestamp); // snapshotTimestamp
  }

  function testMarketBuyUpdatesTWAP() public {
    // List + buy a kami on marketplace, verify TWAP lastPrice = sale price
    (, uint32 kamiIndex) = _createStakedKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    _fastForward(60); // small time advance so accumulation is non-zero

    vm.deal(bob.owner, 1 ether);
    _buyKami(bob, orderID, LIST_PRICE);

    uint256[] memory data = _ValuesComponent.get(TWAP_ENTITY);
    assertEq(data[1], LIST_PRICE); // lastPrice updated to sale price
    assertEq(data[2], block.timestamp); // lastUpdateTime updated
  }

  function testAcceptOfferUpdatesTWAP() public {
    (, uint32 kamiIndex) = _createStakedKami(alice);
    _setupWETH(bob, LIST_PRICE);

    _fastForward(60);
    uint256 offerID = _offerKami(bob, kamiIndex, LIST_PRICE);
    _acceptOffer(alice, offerID, kamiIndex);

    uint256[] memory data = _ValuesComponent.get(TWAP_ENTITY);
    assertEq(data[1], LIST_PRICE);
    assertEq(data[2], block.timestamp);
  }

  function testTWAPAccumulatesFromSales() public {
    // Sale 1: after 1h at init price 0.01 ETH
    (, uint32 kamiIndex1) = _createStakedKami(alice);
    uint256 orderID1 = _listKami(alice, kamiIndex1, 0.02 ether);

    _fastForward(3600);
    vm.deal(bob.owner, 10 ether);
    _buyKami(bob, orderID1, 0.02 ether);

    // cumulative = 0.01 ether * 3600 = 36e18
    uint256[] memory data1 = _ValuesComponent.get(TWAP_ENTITY);
    assertEq(data1[0], 0.01 ether * 3600);
    assertEq(data1[1], 0.02 ether); // lastPrice updated to sale price

    // Sale 2: another hour later at 0.03 ETH
    (, uint32 kamiIndex2) = _createStakedKami(alice);
    uint256 orderID2 = _listKami(alice, kamiIndex2, 0.03 ether);

    _fastForward(3600);
    _buyKami(bob, orderID2, 0.03 ether);

    // cumulative = 36e18 + 0.02 ether * 3600 = 36e18 + 72e18 = 108e18
    uint256[] memory data2 = _ValuesComponent.get(TWAP_ENTITY);
    assertEq(data2[0], 0.01 ether * 3600 + 0.02 ether * 3600);
    assertEq(data2[1], 0.03 ether);
  }

  function testSnapshotRolloverOnSale() public {
    // Warp past 24h window, then buy — should trigger snapshot rollover
    (, uint32 kamiIndex) = _createStakedKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    _fastForward(TWAP_WINDOW + 1);

    vm.deal(bob.owner, 1 ether);
    _buyKami(bob, orderID, LIST_PRICE);

    uint256[] memory data = _ValuesComponent.get(TWAP_ENTITY);
    // After rollover: snapshotCumulative == cumulative, snapshotTimestamp == now
    assertEq(data[3], data[0]);
    assertEq(data[4], block.timestamp);
  }

  function testTWAPCalculation() public {
    // Init: lastPrice = 0.01 ETH at T=0
    // Sale 1 after 1h at 0.02 ETH (accumulates 0.01 * 3600)
    (, uint32 kamiIndex1) = _createStakedKami(alice);
    uint256 orderID1 = _listKami(alice, kamiIndex1, 0.02 ether);

    _fastForward(3600);
    vm.deal(bob.owner, 10 ether);
    _buyKami(bob, orderID1, 0.02 ether);
    // Now lastPrice = 0.02 ETH

    // Sale 2 after another 1h at 0.02 ETH (accumulates 0.02 * 3600)
    (, uint32 kamiIndex2) = _createStakedKami(alice);
    uint256 orderID2 = _listKami(alice, kamiIndex2, 0.02 ether);

    _fastForward(3600);
    _buyKami(bob, orderID2, 0.02 ether);

    // Total cumulative = 0.01*3600 + 0.02*3600 = 108 ether-seconds
    // Window time = 7200 seconds (from snapshot at init)
    // TWAP = 108e18 / 7200 = 0.015 ether
    uint256[] memory data = _ValuesComponent.get(TWAP_ENTITY);
    uint256 expected = 0.01 ether * 3600 + 0.02 ether * 3600;
    assertEq(data[0], expected);
  }

  function testMinPriceFloor() public {
    // Re-initialize with very low price
    vm.prank(deployer);
    __NewbieVendorRegistrySystem.initTWAP(0.001 ether); // below min

    // Do a sale at low price to set lastPrice low
    (, uint32 kamiIndex1) = _createStakedKami(alice);
    uint256 orderID1 = _listKami(alice, kamiIndex1, 0.001 ether);
    _fastForward(3600);
    vm.deal(bob.owner, 10 ether);
    _buyKami(bob, orderID1, 0.001 ether);

    // Mint kami for alice (who is also the vendor address)
    uint256 kamiID = _mintKami(alice);
    uint32 kamiIndex = LibKami.getIndex(components, kamiID);

    uint256[] memory pool = new uint256[](1);
    pool[0] = uint256(kamiIndex);
    vm.prank(deployer);
    __NewbieVendorRegistrySystem.setPool(pool);

    // The TWAP price is below min, so vendor should charge MIN_PRICE = 0.005 ether
    // Charlie buys at minPrice (bob already bought, use charlie)
    vm.deal(charlie.owner, 1 ether);
    vm.prank(charlie.owner);
    _NewbieVendorBuySystem.executeTyped{value: MIN_PRICE}(kamiIndex);

    assertTrue(LibFlag.has(components, charlie.id, "NEWBIE_VENDOR_PURCHASED"));
  }

  function testDefaultMinPriceFloorWhenUnset() public {
    vm.startPrank(deployer);
    __NewbieVendorRegistrySystem.setMinPrice(0);
    __NewbieVendorRegistrySystem.initTWAP(0);
    vm.stopPrank();

    uint256 kamiID = _mintKami(alice);
    uint32 kamiIndex = LibKami.getIndex(components, kamiID);

    uint256[] memory pool = new uint256[](1);
    pool[0] = uint256(kamiIndex);
    vm.prank(deployer);
    __NewbieVendorRegistrySystem.setPool(pool);

    vm.deal(charlie.owner, 1 ether);
    vm.startPrank(charlie.owner);
    vm.expectRevert("NewbieVendor: insufficient ETH");
    _NewbieVendorBuySystem.executeTyped{value: 0}(kamiIndex);
    vm.stopPrank();

    vm.prank(charlie.owner);
    _NewbieVendorBuySystem.executeTyped{value: MIN_PRICE}(kamiIndex);
    assertTrue(LibFlag.has(components, charlie.id, "NEWBIE_VENDOR_PURCHASED"));
  }

  function testVendorBuyUsesTWAPPrice() public {
    // Set up: sale at 0.02 ETH after 1h
    (, uint32 kamiIndex1) = _createStakedKami(alice);
    uint256 orderID1 = _listKami(alice, kamiIndex1, 0.02 ether);

    _fastForward(3600);
    vm.deal(bob.owner, 10 ether);
    _buyKami(bob, orderID1, 0.02 ether);
    // cumulative = 0.01*3600 = 36e18, lastPrice = 0.02

    // Warp another hour (no sale, but lastPrice = 0.02 continues accumulating)
    _fastForward(3600);
    // Now: liveCumulative = 0.01*3600 + 0.02*3600 = 108e18
    // windowTime = 7200
    // TWAP = 108e18 / 7200 = 0.015 ether

    // Mint kami for alice (who is also the vendor address)
    uint256 kamiID = _mintKami(alice);
    uint32 kamiIndex = LibKami.getIndex(components, kamiID);

    uint256[] memory pool = new uint256[](1);
    pool[0] = uint256(kamiIndex);
    vm.prank(deployer);
    __NewbieVendorRegistrySystem.setPool(pool);

    uint256 expectedPrice = 0.015 ether;

    // Charlie buys at TWAP price
    vm.deal(charlie.owner, 1 ether);
    vm.prank(charlie.owner);
    _NewbieVendorBuySystem.executeTyped{value: expectedPrice}(kamiIndex);

    assertTrue(LibFlag.has(components, charlie.id, "NEWBIE_VENDOR_PURCHASED"));
  }

  //////////////////
  // SOULBOUND TESTS

  function testVendorBuySetsKamiSoulbound() public {
    (uint32 kamiIndex, ) = _vendorBuyAsCharlie();

    // kami should be soulbound — listing reverts
    vm.startPrank(charlie.operator);
    vm.expectRevert("kami is soulbound");
    _KamiMarketListSystem.executeTyped(kamiIndex, 1 ether, 0);
    vm.stopPrank();
  }

  function testSoulboundBlocksUnstake() public {
    (uint32 kamiIndex, ) = _vendorBuyAsCharlie();

    // move charlie to room 12 (bridge room) for unstaking
    vm.prank(deployer);
    _IndexRoomComponent.set(charlie.id, uint32(12));

    vm.startPrank(charlie.owner);
    vm.expectRevert("kami is soulbound");
    _Kami721UnstakeSystem.executeTyped(kamiIndex);
    vm.stopPrank();
  }

  function testSoulboundBlocksAcceptOffer() public {
    (uint32 kamiIndex, ) = _vendorBuyAsCharlie();

    // bob makes an offer on charlie's soulbound kami
    _setupWETH(bob, 1 ether);
    uint256 offerID = _offerKami(bob, kamiIndex, 0.5 ether);

    // charlie tries to accept — soulbound blocks it
    vm.startPrank(charlie.operator);
    vm.expectRevert("kami is soulbound");
    _KamiMarketAcceptOfferSystem.executeTyped(offerID, kamiIndex);
    vm.stopPrank();
  }

  function testSoulboundExpiresAfter3Days() public {
    (uint32 kamiIndex, ) = _vendorBuyAsCharlie();

    // still soulbound — listing fails
    vm.startPrank(charlie.operator);
    vm.expectRevert("kami is soulbound");
    _KamiMarketListSystem.executeTyped(kamiIndex, 1 ether, 0);
    vm.stopPrank();

    // warp past 3 days
    _fastForward(3 days);

    // now listing succeeds
    vm.startPrank(charlie.operator);
    _KamiMarketListSystem.executeTyped(kamiIndex, 1 ether, 0);
    vm.stopPrank();
  }

  function testMarketplaceBuyDoesNotSetSoulbound() public {
    // regular marketplace buy — no soulbound applied
    (, uint32 kamiIndex) = _createStakedKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    vm.deal(bob.owner, 1 ether);
    _buyKami(bob, orderID, LIST_PRICE);

    // bob can immediately list the kami (no soulbound)
    vm.startPrank(bob.operator);
    _KamiMarketListSystem.executeTyped(kamiIndex, 1 ether, 0);
    vm.stopPrank();
  }

  //////////////////
  // BATCH COLLECTION OFFER TESTS

  function _collectionOffer(
    PlayerAccount memory acc,
    uint256 price,
    uint32 quantity
  ) internal returns (uint256 orderID) {
    vm.startPrank(acc.operator);
    orderID = abi.decode(
      _KamiMarketOfferSystem.executeTypedCollection(price, quantity, 0),
      (uint256)
    );
    vm.stopPrank();
  }

  function _batchAcceptCollection(
    PlayerAccount memory acc,
    uint256 offerID,
    uint32[] memory kamiIndices
  ) internal {
    vm.startPrank(acc.operator);
    _KamiMarketAcceptOfferSystem.executeTyped(offerID, kamiIndices);
    vm.stopPrank();
  }

  function testBatchAcceptCollectionOffer() public {
    // alice creates 3 kamis, bob makes collection offer for 3
    (uint256 kamiID1, uint32 idx1) = _createStakedKami(alice);
    (uint256 kamiID2, uint32 idx2) = _createStakedKami(alice);
    (uint256 kamiID3, uint32 idx3) = _createStakedKami(alice);

    uint256 price = 0.1 ether;
    _setupWETH(bob, price * 3);
    uint256 offerID = _collectionOffer(bob, price, 3);

    uint32[] memory indices = new uint32[](3);
    indices[0] = idx1;
    indices[1] = idx2;
    indices[2] = idx3;

    _batchAcceptCollection(alice, offerID, indices);

    // all kamis transferred to bob
    assertEq(LibKami.getAccount(components, kamiID1), bob.id);
    assertEq(LibKami.getAccount(components, kamiID2), bob.id);
    assertEq(LibKami.getAccount(components, kamiID3), bob.id);

    // offer fully filled
    assertEq(_StateComponent.get(offerID), "FILLED");

    // WETH moved from bob to alice (0% fee)
    assertEq(weth.balanceOf(alice.owner), price * 3);
    assertEq(weth.balanceOf(bob.owner), 0);
  }

  function testBatchAcceptPartialFill() public {
    // collection offer for 5, alice batch-fills 2
    (, uint32 idx1) = _createStakedKami(alice);
    (, uint32 idx2) = _createStakedKami(alice);

    uint256 price = 0.1 ether;
    _setupWETH(bob, price * 5);
    uint256 offerID = _collectionOffer(bob, price, 5);

    uint32[] memory indices = new uint32[](2);
    indices[0] = idx1;
    indices[1] = idx2;

    _batchAcceptCollection(alice, offerID, indices);

    // offer still active with 3 remaining
    assertEq(_StateComponent.get(offerID), "ACTIVE");
    assertEq(_BalanceComponent.get(offerID), int32(3));

    // WETH: alice gets 2 * price
    assertEq(weth.balanceOf(alice.owner), price * 2);
  }

  function testBatchAcceptExactFill() public {
    // collection offer for 3, alice fills all 3
    (, uint32 idx1) = _createStakedKami(alice);
    (, uint32 idx2) = _createStakedKami(alice);
    (, uint32 idx3) = _createStakedKami(alice);

    uint256 price = 0.05 ether;
    _setupWETH(bob, price * 3);
    uint256 offerID = _collectionOffer(bob, price, 3);

    uint32[] memory indices = new uint32[](3);
    indices[0] = idx1;
    indices[1] = idx2;
    indices[2] = idx3;

    _batchAcceptCollection(alice, offerID, indices);

    assertEq(_StateComponent.get(offerID), "FILLED");
  }

  function testBatchAcceptExceedsQuantity() public {
    // collection offer for 2, try to fill 3
    (, uint32 idx1) = _createStakedKami(alice);
    (, uint32 idx2) = _createStakedKami(alice);
    (, uint32 idx3) = _createStakedKami(alice);

    uint256 price = 0.1 ether;
    _setupWETH(bob, price * 3);
    uint256 offerID = _collectionOffer(bob, price, 2);

    uint32[] memory indices = new uint32[](3);
    indices[0] = idx1;
    indices[1] = idx2;
    indices[2] = idx3;

    vm.startPrank(alice.operator);
    vm.expectRevert("KamiMarket: insufficient quantity");
    _KamiMarketAcceptOfferSystem.executeTyped(offerID, indices);
    vm.stopPrank();
  }

  function testBatchAcceptSoulboundBlocks() public {
    // one kami is soulbound from vendor buy — entire batch reverts
    (uint32 sbIdx, ) = _vendorBuyAsCharlie();
    (, uint32 normalIdx) = _createStakedKami(charlie);

    uint256 price = 0.1 ether;
    _setupWETH(bob, price * 2);
    uint256 offerID = _collectionOffer(bob, price, 2);

    uint32[] memory indices = new uint32[](2);
    indices[0] = normalIdx;
    indices[1] = sbIdx; // soulbound kami second

    vm.startPrank(charlie.operator);
    vm.expectRevert("kami is soulbound");
    _KamiMarketAcceptOfferSystem.executeTyped(offerID, indices);
    vm.stopPrank();
  }

  function testBatchAcceptNotCollectionOffer() public {
    // try batch with a specific offer ID — should revert
    (, uint32 idx1) = _createStakedKami(alice);
    (, uint32 idx2) = _createStakedKami(alice);

    uint256 price = 0.1 ether;
    _setupWETH(bob, price);
    uint256 offerID = _offerKami(bob, idx1, price);

    uint32[] memory indices = new uint32[](2);
    indices[0] = idx1;
    indices[1] = idx2;

    vm.startPrank(alice.operator);
    vm.expectRevert("KamiMarket: wrong order type");
    _KamiMarketAcceptOfferSystem.executeTyped(offerID, indices);
    vm.stopPrank();
  }
}
