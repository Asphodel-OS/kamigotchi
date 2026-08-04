// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";
import { KamiMarketVault } from "tokens/KamiMarketVault.sol";
import { OpenMintable } from "tokens/OpenMintable.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKami721 } from "libraries/LibKami721.sol";

/// @notice Tests for Newbie Vendor floor-derived pricing:
///         calcPrice = max(110% of the cheapest active listing, minPrice)
///         with the vendor's own and expired listings excluded.
contract NewbieVendorFloorPriceTest is SetupTemplate {
  uint256 constant MIN_PRICE = 0.005 ether;

  KamiMarketVault vault;
  OpenMintable weth;
  address treasury;

  function setUp() public override {
    super.setUp();
    vm.roll(_currBlock++);

    weth = new OpenMintable("Wrapped Ether", "WETH");
    vault = new KamiMarketVault(address(weth), address(LibKami721.getContract(components)), deployer);
    treasury = address(0xFEE);

    vm.startPrank(deployer);

    // Vendor: alice's owner wallet holds the vendor stock
    __NewbieVendorRegistrySystem.setEnabled(true);
    __NewbieVendorRegistrySystem.setVendorAddress(alice.owner);
    __NewbieVendorRegistrySystem.setCycleDuration(172800);
    __NewbieVendorRegistrySystem.setMinPrice(MIN_PRICE);

    // Marketplace
    vault.authorizeCaller(address(_KamiMarketAcceptOfferSystem));
    __KamiMarketRegistrySystem.setVault(address(vault));
    __KamiMarketRegistrySystem.setFeeRecipient(treasury);
    __KamiMarketRegistrySystem.setEnabled(true);
    __KamiMarketRegistrySystem.setPurchaseCooldown(3600);

    // 0% fee for simpler price math
    uint32[8] memory feeRate;
    feeRate[0] = 4;
    feeRate[1] = 0;
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
    return _listKamiWithExpiry(acc, kamiIndex, price, 0);
  }

  function _listKamiWithExpiry(
    PlayerAccount memory acc,
    uint32 kamiIndex,
    uint256 price,
    uint256 expiry
  ) internal returns (uint256 orderID) {
    vm.startPrank(acc.operator);
    orderID = abi.decode(_KamiMarketListSystem.executeTyped(kamiIndex, price, expiry), (uint256));
    vm.stopPrank();
  }

  function _buyKami(PlayerAccount memory acc, uint256 listingID, uint256 value) internal {
    uint256[] memory ids = new uint256[](1);
    ids[0] = listingID;
    vm.deal(acc.owner, value + 1 ether);
    vm.startPrank(acc.owner);
    _KamiMarketBuySystem.executeTyped{ value: value }(ids);
    vm.stopPrank();
  }

  function _cancelListing(PlayerAccount memory acc, uint256 orderID) internal {
    vm.startPrank(acc.operator);
    _KamiMarketCancelSystem.executeTyped(orderID);
    vm.stopPrank();
  }

  /// @notice list `count` of bob's kamis at the given prices
  function _listMany(uint256[] memory prices) internal returns (uint256[] memory orderIDs) {
    orderIDs = new uint256[](prices.length);
    for (uint256 i; i < prices.length; i++) {
      (, uint32 kamiIndex) = _createStakedKami(bob);
      orderIDs[i] = _listKami(bob, kamiIndex, prices[i]);
    }
  }

  /// @notice put one of alice's (vendor's) kamis in the display pool
  function _stockVendor() internal returns (uint32 kamiIndex) {
    uint256 kamiID = _mintKami(alice);
    kamiIndex = LibKami.getIndex(components, kamiID);
    uint256[] memory pool = new uint256[](1);
    pool[0] = uint256(kamiIndex);
    vm.prank(deployer);
    __NewbieVendorRegistrySystem.setPool(pool);
  }

  /////////////////
  // PRICING

  function testPriceIsMinWithNoListings() public view {
    assertEq(_NewbieVendorBuySystem.calcPrice(), MIN_PRICE);
  }

  function testPriceTracksCheapestListing() public {
    uint256[] memory prices = new uint256[](2);
    prices[0] = 0.02 ether;
    prices[1] = 0.03 ether;
    _listMany(prices);

    // cheapest 0.02 * 110% = 0.022
    assertEq(_NewbieVendorBuySystem.calcPrice(), 0.022 ether);
  }

  function testPriceUsesCheapestOfMany() public {
    uint256[] memory prices = new uint256[](12);
    for (uint256 i; i < 12; i++) prices[i] = (i + 1) * 0.01 ether;
    _listMany(prices);

    // cheapest 0.01 * 110% = 0.011
    assertEq(_NewbieVendorBuySystem.calcPrice(), 0.011 ether);
  }

  function testDustListingClampsAtMinPrice() public {
    uint256[] memory prices = new uint256[](1);
    prices[0] = 1; // 1 wei manipulation attempt
    _listMany(prices);

    assertEq(_NewbieVendorBuySystem.calcPrice(), MIN_PRICE);
  }

  function testAbsurdListingPriceIgnored() public {
    // a max-price listing must not overflow calcPrice or skew it — it gets
    // skipped entirely (review finding)
    uint256[] memory prices = new uint256[](2);
    prices[0] = type(uint256).max;
    prices[1] = 0.02 ether;
    _listMany(prices);

    assertEq(_NewbieVendorBuySystem.calcPrice(), 0.022 ether); // only the real one counts
  }

  function testVendorOwnListingsExcluded() public {
    // the vendor's (alice) own listing must not set her floor; priced above the
    // min-clamp so a broken exclusion would show as 0.022 instead of MIN_PRICE
    (, uint32 kamiIndex) = _createStakedKami(alice);
    _listKami(alice, kamiIndex, 0.02 ether);

    assertEq(_NewbieVendorBuySystem.calcPrice(), MIN_PRICE);
  }

  function testFilledAndCancelledListingsDropOut() public {
    uint256[] memory prices = new uint256[](2);
    prices[0] = 0.02 ether;
    prices[1] = 0.04 ether;
    uint256[] memory orderIDs = _listMany(prices);

    assertEq(_NewbieVendorBuySystem.calcPrice(), 0.022 ether); // cheapest 0.02 * 110%

    _buyKami(charlie, orderIDs[0], 0.02 ether);
    assertEq(_NewbieVendorBuySystem.calcPrice(), 0.044 ether); // only 0.04 left

    _cancelListing(bob, orderIDs[1]);
    assertEq(_NewbieVendorBuySystem.calcPrice(), MIN_PRICE); // index empty
  }

  function testExpiredListingsExcluded() public {
    (, uint32 kamiIndex) = _createStakedKami(bob);
    _listKamiWithExpiry(bob, kamiIndex, 0.02 ether, block.timestamp + 100);

    assertEq(_NewbieVendorBuySystem.calcPrice(), 0.022 ether);

    _fastForward(200);
    assertEq(_NewbieVendorBuySystem.calcPrice(), MIN_PRICE);
  }

  /////////////////
  // BUY FLOW

  function testVendorBuyChargesFloorPrice() public {
    uint256[] memory prices = new uint256[](1);
    prices[0] = 0.02 ether;
    _listMany(prices);
    uint32 kamiIndex = _stockVendor();

    uint256 expectedPrice = 0.022 ether;
    assertEq(_NewbieVendorBuySystem.calcPrice(), expectedPrice);

    vm.deal(charlie.owner, 1 ether);
    vm.startPrank(charlie.owner);
    vm.expectRevert("NewbieVendor: insufficient ETH");
    _NewbieVendorBuySystem.executeTyped{ value: expectedPrice - 1 }(kamiIndex);

    _NewbieVendorBuySystem.executeTyped{ value: expectedPrice }(kamiIndex);
    vm.stopPrank();

    assertTrue(LibFlag.has(components, charlie.id, "NEWBIE_VENDOR_PURCHASED"));
  }

  /////////////////
  // ADMIN INDEX REBUILD

  function testRebuildListingIndex() public {
    uint256[] memory prices = new uint256[](2);
    prices[0] = 0.02 ether;
    prices[1] = 0.03 ether;
    uint256[] memory orderIDs = _listMany(prices);

    // wipe → price falls back to min
    vm.prank(deployer);
    __KamiMarketRegistrySystem.rebuildListingIndex(new uint256[](0));
    assertEq(_NewbieVendorBuySystem.calcPrice(), MIN_PRICE);

    // restore → tracks listings again
    vm.prank(deployer);
    __KamiMarketRegistrySystem.rebuildListingIndex(orderIDs);
    assertEq(_NewbieVendorBuySystem.calcPrice(), 0.022 ether);
  }

  function testRebuildListingIndexRejectsInactive() public {
    uint256[] memory prices = new uint256[](1);
    prices[0] = 0.02 ether;
    uint256[] memory orderIDs = _listMany(prices);

    _buyKami(charlie, orderIDs[0], 0.02 ether); // now FILLED

    vm.prank(deployer);
    vm.expectRevert("KamiMarketRegistry: not active");
    __KamiMarketRegistrySystem.rebuildListingIndex(orderIDs);
  }

  function testRebuildListingIndexRejectsNonListing() public {
    uint256[] memory ids = new uint256[](1);
    ids[0] = 12345; // arbitrary non-listing entity

    vm.prank(deployer);
    vm.expectRevert("KamiMarketRegistry: not a listing");
    __KamiMarketRegistrySystem.rebuildListingIndex(ids);
  }

  function testRebuildListingIndexRejectsDuplicates() public {
    uint256[] memory prices = new uint256[](1);
    prices[0] = 0.02 ether;
    uint256[] memory orderIDs = _listMany(prices);

    uint256[] memory dup = new uint256[](2);
    dup[0] = orderIDs[0];
    dup[1] = orderIDs[0];

    vm.prank(deployer);
    vm.expectRevert("KamiMarketRegistry: duplicate id");
    __KamiMarketRegistrySystem.rebuildListingIndex(dup);
  }

  function testRebuildListingIndexOnlyAdmin() public {
    vm.prank(bob.owner);
    vm.expectRevert();
    __KamiMarketRegistrySystem.rebuildListingIndex(new uint256[](0));
  }

  function testRebuildListingIndexRejectsOversized() public {
    // length gate fires before shape validation, so dummy ids suffice
    uint256[] memory ids = new uint256[](101);
    vm.prank(deployer);
    vm.expectRevert("KamiMarketRegistry: exceeds index cap");
    __KamiMarketRegistrySystem.rebuildListingIndex(ids);
  }
}
