// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";
import { Vm } from "forge-std/Vm.sol";
import { Kami721 } from "tokens/Kami721.sol";
import { KamiMarketVault } from "tokens/KamiMarketVault.sol";
import { OpenMintable } from "tokens/OpenMintable.sol";
import { LibKamiMarket } from "libraries/LibKamiMarket.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKami721 } from "libraries/LibKami721.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

contract GasHeavyReceiver {
  uint256 public numReceives;

  receive() external payable {
    numReceives++;
  }
}

/// @notice tests for Kami Marketplace orderbook
contract KamiMarketTest is SetupTemplate {
  KamiMarketVault vault;
  OpenMintable weth;
  address treasury;
  GasHeavyReceiver treasuryReceiver;

  // test prices
  uint256 constant LIST_PRICE = 1 ether;
  uint256 constant OFFER_PRICE = 0.5 ether;

  function setUp() public override {
    super.setUp();
    vm.roll(_currBlock++);

    // Deploy mock WETH
    weth = new OpenMintable("Wrapped Ether", "WETH");

    // Deploy vault with deployer as owner
    vault = new KamiMarketVault(address(weth), address(LibKami721.getContract(components)), deployer);

    // Treasury as a contract that needs more than 2300 gas to receive ETH.
    // This catches regressions to `transfer` in payout logic.
    treasuryReceiver = new GasHeavyReceiver();
    treasury = address(treasuryReceiver);

    // Configure marketplace
    vm.startPrank(deployer);

    // Authorize marketplace systems to call vault
    vault.authorizeCaller(address(_KamiMarketBuySystem));
    vault.authorizeCaller(address(_KamiMarketAcceptOfferSystem));

    // Set marketplace configs
    __KamiMarketRegistrySystem.setVault(address(vault));
    __KamiMarketRegistrySystem.setFeeRecipient(treasury);
    __KamiMarketRegistrySystem.setMaxOrders(50);
    __KamiMarketRegistrySystem.setEnabled(true);

    // Fee rate: 2.5% → [4, 250, 0, 0, 0, 0, 0, 0] → 250/10^4 = 0.025
    uint32[8] memory feeRate;
    feeRate[0] = 4; // precision: 10^4
    feeRate[1] = 250; // numerator: 250/10000 = 2.5%
    __KamiMarketRegistrySystem.setFeeRate(feeRate);

    vm.stopPrank();
  }

  /////////////////
  // HELPERS

  /// @notice Mint a kami and bridge it out (721_EXTERNAL state)
  function _createExternalKami(PlayerAccount memory acc) internal returns (uint256 kamiID, uint32 kamiIndex) {
    kamiID = _mintKami(acc);
    kamiIndex = LibKami.getIndex(components, kamiID);
    // Bridge out: the kami is currently in-world (RESTING), need to unstake
    _unstakeKami(kamiID);
    // Verify it's now 721_EXTERNAL
    assertTrue(LibKami.isState(components, kamiID, "721_EXTERNAL"));
    // Verify EOA owner
    assertEq(LibKami721.getEOAOwner(components, kamiIndex), acc.owner);
    // Approve vault for Kami721 transfers (like approving OpenSea)
    Kami721 kami721 = LibKami721.getContract(components);
    vm.prank(acc.owner);
    kami721.setApprovalForAll(address(vault), true);
  }

  function _listKami(
    PlayerAccount memory acc,
    uint32 kamiIndex,
    uint256 price
  ) internal returns (uint256 orderID) {
    vm.startPrank(acc.owner);
    orderID = abi.decode(_KamiMarketListSystem.executeTyped(kamiIndex, price, 0), (uint256));
    vm.stopPrank();
  }

  function _buyKami(PlayerAccount memory acc, uint256[] memory listingIDs, uint256 value) internal {
    vm.startPrank(acc.owner);
    _KamiMarketBuySystem.executeTyped{value: value}(listingIDs);
    vm.stopPrank();
  }

  function _buyKami(PlayerAccount memory acc, uint256 listingID, uint256 value) internal {
    uint256[] memory ids = new uint256[](1);
    ids[0] = listingID;
    _buyKami(acc, ids, value);
  }

  function _offerKami(
    PlayerAccount memory acc,
    uint32 kamiIndex,
    uint256 price
  ) internal returns (uint256 orderID) {
    vm.startPrank(acc.owner);
    orderID = abi.decode(_KamiMarketOfferSystem.executeTypedOffer(kamiIndex, price, 0), (uint256));
    vm.stopPrank();
  }

  function _collectionOffer(
    PlayerAccount memory acc,
    uint256 price,
    uint32 quantity
  ) internal returns (uint256 orderID) {
    vm.startPrank(acc.owner);
    orderID = abi.decode(
      _KamiMarketOfferSystem.executeTypedCollection(price, quantity, 0),
      (uint256)
    );
    vm.stopPrank();
  }

  function _acceptOffer(PlayerAccount memory acc, uint256 offerID, uint32 kamiIndex) internal {
    vm.startPrank(acc.owner);
    _KamiMarketAcceptOfferSystem.executeTyped(offerID, kamiIndex);
    vm.stopPrank();
  }

  function _cancelOrder(PlayerAccount memory acc, uint256 orderID) internal {
    vm.startPrank(acc.owner);
    _KamiMarketCancelSystem.executeTyped(orderID);
    vm.stopPrank();
  }

  /// @notice Give WETH to a user and approve vault
  function _setupWETH(PlayerAccount memory acc, uint256 amount) internal {
    weth.mint(acc.owner, amount);
    vm.prank(acc.owner);
    weth.approve(address(vault), type(uint256).max);
  }

  function _findWorldEvent(Vm.Log[] memory logs, string memory identifier) internal pure returns (Vm.Log memory) {
    bytes32 identifierHash = keccak256(bytes(identifier));
    for (uint256 i = 0; i < logs.length; i++) {
      if (logs[i].topics.length > 1 && logs[i].topics[1] == identifierHash) {
        return logs[i];
      }
    }
    revert("WorldEvent not found");
  }

  /////////////////
  // LISTING TESTS

  function testListKami() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    // Verify listing entity
    assertTrue(LibEntityType.isShape(components, orderID, "KAMI_LISTING"));
    assertEq(_StateComponent.get(orderID), "ACTIVE");
    assertEq(_ValueComponent.get(orderID), LIST_PRICE);
    assertEq(_IndexKamiComponent.get(orderID), kamiIndex);

    // Verify kami is marked LISTED but still in seller's wallet (no escrow)
    uint256 kamiID = LibKami.getByIndex(components, kamiIndex);
    assertEq(LibKami.getState(components, kamiID), "LISTED");
    assertEq(LibKami721.getEOAOwner(components, kamiIndex), alice.owner);
  }

  function testBuyListing() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    // Give Bob ETH
    vm.deal(bob.owner, 2 ether);
    uint256 aliceBalBefore = alice.owner.balance;

    // Buy
    _buyKami(bob, orderID, LIST_PRICE);

    // Verify kami transferred to Bob
    assertEq(LibKami721.getEOAOwner(components, kamiIndex), bob.owner);
    uint256 kamiID = LibKami.getByIndex(components, kamiIndex);
    assertEq(LibKami.getState(components, kamiID), "721_EXTERNAL");

    // Verify ETH distribution: seller gets price - fee, treasury gets fee
    uint256 fee = (LIST_PRICE * 250) / 10000; // 2.5%
    uint256 sellerReceives = LIST_PRICE - fee;
    assertEq(alice.owner.balance - aliceBalBefore, sellerReceives);
    assertEq(treasury.balance, fee);

    // Verify listing is filled
    assertEq(_StateComponent.get(orderID), "FILLED");
  }

  function testBatchBuyListings() public {
    (, uint32 kamiIndex1) = _createExternalKami(alice);
    (, uint32 kamiIndex2) = _createExternalKami(alice);

    uint256 orderID1 = _listKami(alice, kamiIndex1, 1 ether);
    uint256 orderID2 = _listKami(alice, kamiIndex2, 2 ether);

    uint256 totalPrice = 3 ether;
    vm.deal(bob.owner, totalPrice);
    uint256 aliceBalBefore = alice.owner.balance;

    uint256[] memory ids = new uint256[](2);
    ids[0] = orderID1;
    ids[1] = orderID2;
    _buyKami(bob, ids, totalPrice);

    // Both kamis now owned by Bob
    assertEq(LibKami721.getEOAOwner(components, kamiIndex1), bob.owner);
    assertEq(LibKami721.getEOAOwner(components, kamiIndex2), bob.owner);

    // Alice received total minus fees
    uint256 totalFee = (totalPrice * 250) / 10000;
    uint256 totalSellerReceives = totalPrice - totalFee;
    assertEq(alice.owner.balance - aliceBalBefore, totalSellerReceives);
    assertEq(treasury.balance, totalFee);
  }

  function testBuyRefundsExcess() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    uint256 excess = 0.5 ether;
    vm.deal(bob.owner, LIST_PRICE + excess);

    _buyKami(bob, orderID, LIST_PRICE + excess);

    // Bob should get excess refunded
    assertEq(bob.owner.balance, excess);
  }

  /////////////////
  // OFFER TESTS

  function testCreateOffer() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // Bob creates offer for alice's kami
    _setupWETH(bob, OFFER_PRICE);
    uint256 orderID = _offerKami(bob, kamiIndex, OFFER_PRICE);

    // Verify offer entity
    assertTrue(LibEntityType.isShape(components, orderID, "KAMI_OFFER"));
    assertEq(_StateComponent.get(orderID), "ACTIVE");
    assertEq(_ValueComponent.get(orderID), OFFER_PRICE);
    assertEq(_IndexKamiComponent.get(orderID), kamiIndex);

    // No WETH moved (approval-based)
    assertEq(weth.balanceOf(bob.owner), OFFER_PRICE);
  }

  function testCreateCollectionOffer() public {
    _setupWETH(bob, 5 ether);
    uint256 orderID = _collectionOffer(bob, OFFER_PRICE, 3);

    // Verify collection offer entity
    assertTrue(LibEntityType.isShape(components, orderID, "KAMI_COLLECTION_OFFER"));
    assertEq(_StateComponent.get(orderID), "ACTIVE");
    assertEq(_ValueComponent.get(orderID), OFFER_PRICE);
    assertEq(_BalanceComponent.get(orderID), int32(3));
    assertEq(_MaxComponent.get(orderID), 3);
  }

  function testAcceptOffer() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // Bob offers for alice's kami
    _setupWETH(bob, OFFER_PRICE);
    uint256 orderID = _offerKami(bob, kamiIndex, OFFER_PRICE);

    // Alice accepts
    _acceptOffer(alice, orderID, kamiIndex);

    // Verify kami transferred to Bob
    assertEq(LibKami721.getEOAOwner(components, kamiIndex), bob.owner);

    // Verify WETH distribution
    uint256 fee = (OFFER_PRICE * 250) / 10000;
    uint256 sellerReceives = OFFER_PRICE - fee;
    assertEq(weth.balanceOf(alice.owner), sellerReceives);
    assertEq(weth.balanceOf(treasury), fee);
    assertEq(weth.balanceOf(bob.owner), 0);

    // Verify offer is filled
    assertEq(_StateComponent.get(orderID), "FILLED");
  }

  function testAcceptCollectionOffer() public {
    (, uint32 kamiIndex1) = _createExternalKami(alice);
    (, uint32 kamiIndex2) = _createExternalKami(alice);

    // Bob makes collection offer for 2 kamis
    _setupWETH(bob, OFFER_PRICE * 2);
    uint256 orderID = _collectionOffer(bob, OFFER_PRICE, 2);

    // Alice accepts with first kami
    _acceptOffer(alice, orderID, kamiIndex1);

    // Verify partial fill
    assertEq(LibKami721.getEOAOwner(components, kamiIndex1), bob.owner);
    assertEq(_BalanceComponent.get(orderID), int32(1)); // 1 remaining
    assertEq(_StateComponent.get(orderID), "ACTIVE"); // still active
  }

  function testAcceptCollectionOfferFull() public {
    (, uint32 kamiIndex1) = _createExternalKami(alice);
    (, uint32 kamiIndex2) = _createExternalKami(alice);

    _setupWETH(bob, OFFER_PRICE * 2);
    uint256 orderID = _collectionOffer(bob, OFFER_PRICE, 2);

    // Fill both
    _acceptOffer(alice, orderID, kamiIndex1);
    _acceptOffer(alice, orderID, kamiIndex2);

    // Fully filled
    assertEq(_StateComponent.get(orderID), "FILLED");
    assertEq(LibKami721.getEOAOwner(components, kamiIndex1), bob.owner);
    assertEq(LibKami721.getEOAOwner(components, kamiIndex2), bob.owner);
  }

  /////////////////
  // ACCEPT OFFER FOR LISTED KAMI

  function testAcceptOfferForListedKami() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // Alice lists the kami
    uint256 listingID = _listKami(alice, kamiIndex, LIST_PRICE);
    uint256 kamiID = LibKami.getByIndex(components, kamiIndex);
    assertEq(LibKami.getState(components, kamiID), "LISTED");

    // Bob makes an offer for the listed kami
    _setupWETH(bob, OFFER_PRICE);
    uint256 offerID = _offerKami(bob, kamiIndex, OFFER_PRICE);

    // Alice accepts Bob's offer while kami is still listed
    _acceptOffer(alice, offerID, kamiIndex);

    // Verify kami transferred to Bob
    assertEq(LibKami721.getEOAOwner(components, kamiIndex), bob.owner);
    assertEq(LibKami.getState(components, kamiID), "721_EXTERNAL");

    // Verify WETH distribution
    uint256 fee = (OFFER_PRICE * 250) / 10000;
    assertEq(weth.balanceOf(alice.owner), OFFER_PRICE - fee);
    assertEq(weth.balanceOf(treasury), fee);

    // The listing is now stale — buying it should fail
    vm.deal(charlie.owner, LIST_PRICE);
    vm.expectRevert();
    _buyKami(charlie, listingID, LIST_PRICE);
  }

  function testCancelStaleListing() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // Alice lists, then accepts an offer (making listing stale)
    uint256 listingID = _listKami(alice, kamiIndex, LIST_PRICE);
    _setupWETH(bob, OFFER_PRICE);
    uint256 offerID = _offerKami(bob, kamiIndex, OFFER_PRICE);
    _acceptOffer(alice, offerID, kamiIndex);

    // Alice can cancel the stale listing to free her order slot
    _cancelOrder(alice, listingID);
    assertEq(_StateComponent.get(listingID), "CANCELLED");

    // Kami state should still be 721_EXTERNAL (cancel didn't corrupt it)
    uint256 kamiID = LibKami.getByIndex(components, kamiIndex);
    assertEq(LibKami.getState(components, kamiID), "721_EXTERNAL");
  }

  function testAcceptCollectionOfferForListedKami() public {
    (, uint32 kamiIndex1) = _createExternalKami(alice);
    (, uint32 kamiIndex2) = _createExternalKami(alice);

    // List one of the kamis
    _listKami(alice, kamiIndex1, LIST_PRICE);

    // Bob makes collection offer
    _setupWETH(bob, OFFER_PRICE * 2);
    uint256 orderID = _collectionOffer(bob, OFFER_PRICE, 2);

    // Alice accepts with the listed kami
    _acceptOffer(alice, orderID, kamiIndex1);
    assertEq(LibKami721.getEOAOwner(components, kamiIndex1), bob.owner);

    // Alice accepts with the unlisted kami
    _acceptOffer(alice, orderID, kamiIndex2);
    assertEq(LibKami721.getEOAOwner(components, kamiIndex2), bob.owner);
    assertEq(_StateComponent.get(orderID), "FILLED");
  }

  /////////////////
  // CANCEL TESTS

  function testCancelListing() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    // Verify kami marked LISTED but still in seller's wallet
    uint256 kamiID = LibKami.getByIndex(components, kamiIndex);
    assertEq(LibKami.getState(components, kamiID), "LISTED");
    assertEq(LibKami721.getEOAOwner(components, kamiIndex), alice.owner);

    // Cancel
    _cancelOrder(alice, orderID);

    // Verify kami state restored (seller still owns it, no escrow to unwind)
    assertEq(LibKami721.getEOAOwner(components, kamiIndex), alice.owner);
    assertEq(LibKami.getState(components, kamiID), "721_EXTERNAL");

    // Verify order cancelled
    assertEq(_StateComponent.get(orderID), "CANCELLED");
  }

  function testCancelOffer() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    _setupWETH(bob, OFFER_PRICE);
    uint256 orderID = _offerKami(bob, kamiIndex, OFFER_PRICE);

    // Cancel
    _cancelOrder(bob, orderID);

    // Verify order cancelled (no WETH to refund)
    assertEq(_StateComponent.get(orderID), "CANCELLED");
    assertEq(weth.balanceOf(bob.owner), OFFER_PRICE); // WETH still with buyer
  }

  /////////////////
  // PERMISSION TESTS

  function testPermissions() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    // Bob can't cancel alice's listing
    vm.expectRevert();
    _cancelOrder(bob, orderID);

    // Alice can cancel her own
    _cancelOrder(alice, orderID);
  }

  function testSelfTradeBlocked() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    // Alice can't buy her own listing
    vm.deal(alice.owner, LIST_PRICE);
    vm.expectRevert();
    _buyKami(alice, orderID, LIST_PRICE);
  }

  function testSelfTradeBlockedOffer() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // Alice makes offer for her own kami
    _setupWETH(alice, OFFER_PRICE);
    uint256 orderID = _offerKami(alice, kamiIndex, OFFER_PRICE);

    // Alice can't accept her own offer
    vm.expectRevert();
    _acceptOffer(alice, orderID, kamiIndex);
  }

  /////////////////
  // EXPIRY TESTS

  function testExpiredListing() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // Create listing with 1 hour expiry
    vm.prank(alice.owner);
    uint256 orderID = abi.decode(
      _KamiMarketListSystem.executeTyped(kamiIndex, LIST_PRICE, block.timestamp + 1 hours),
      (uint256)
    );

    // Fast forward past expiry
    _fastForward(2 hours);

    // Bob can't buy expired listing
    vm.deal(bob.owner, LIST_PRICE);
    vm.expectRevert();
    _buyKami(bob, orderID, LIST_PRICE);
  }

  function testExpiredOffer() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // Bob creates offer with 1 hour expiry
    _setupWETH(bob, OFFER_PRICE);
    vm.prank(bob.owner);
    uint256 orderID = abi.decode(
      _KamiMarketOfferSystem.executeTypedOffer(kamiIndex, OFFER_PRICE, block.timestamp + 1 hours),
      (uint256)
    );

    // Fast forward past expiry
    _fastForward(2 hours);

    // Alice can't accept expired offer
    vm.expectRevert();
    _acceptOffer(alice, orderID, kamiIndex);
  }

  /////////////////
  // FEE TESTS

  function testFees() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, 4 ether);

    vm.deal(bob.owner, 4 ether);
    uint256 aliceBalBefore = alice.owner.balance;

    _buyKami(bob, orderID, 4 ether);

    // Fee: 4 ETH * 250 / 10000 = 0.1 ETH
    assertEq(treasury.balance, 0.1 ether);
    assertEq(alice.owner.balance - aliceBalBefore, 3.9 ether);
  }

  function testFeesWETH() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    _setupWETH(bob, 4 ether);
    uint256 orderID = _offerKami(bob, kamiIndex, 4 ether);

    _acceptOffer(alice, orderID, kamiIndex);

    // Fee: 4 WETH * 250 / 10000 = 0.1 WETH
    assertEq(weth.balanceOf(treasury), 0.1 ether);
    assertEq(weth.balanceOf(alice.owner), 3.9 ether);
    assertEq(weth.balanceOf(bob.owner), 0);
  }

  /////////////////
  // MAX ORDERS TEST

  function testMaxOrders() public {
    // Set max to 2 for testing
    vm.prank(deployer);
    __KamiMarketRegistrySystem.setMaxOrders(2);

    (, uint32 kamiIndex1) = _createExternalKami(alice);
    (, uint32 kamiIndex2) = _createExternalKami(alice);
    (, uint32 kamiIndex3) = _createExternalKami(alice);

    // Create 2 listings (should succeed)
    _listKami(alice, kamiIndex1, LIST_PRICE);
    _listKami(alice, kamiIndex2, LIST_PRICE);

    // 3rd should fail
    vm.startPrank(alice.owner);
    vm.expectRevert();
    _KamiMarketListSystem.executeTyped(kamiIndex3, LIST_PRICE, 0);
    vm.stopPrank();
  }

  /////////////////
  // ADMIN TESTS

  function testAdminCancel() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    // Admin cancels
    uint256[] memory ids = new uint256[](1);
    ids[0] = orderID;
    vm.prank(deployer);
    _KamiMarketCancelSystem.executeAdmin(ids);

    // Verify cancelled and kami state restored (seller still owns it)
    assertEq(_StateComponent.get(orderID), "CANCELLED");
    assertEq(LibKami721.getEOAOwner(components, kamiIndex), alice.owner);
    uint256 kamiID = LibKami.getByIndex(components, kamiIndex);
    assertEq(LibKami.getState(components, kamiID), "721_EXTERNAL");
  }

  /////////////////
  // INSUFFICIENT WETH TEST

  function testInsufficientWETH() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // Bob approves vault but has no WETH
    vm.prank(bob.owner);
    weth.approve(address(vault), type(uint256).max);

    uint256 orderID = _offerKami(bob, kamiIndex, OFFER_PRICE);

    // Alice tries to accept — should revert because Bob has no WETH
    vm.expectRevert();
    _acceptOffer(alice, orderID, kamiIndex);
  }

  /////////////////
  // ONLY EXTERNAL KAMI TEST

  function testOnlyExternalKami() public {
    // Mint a kami but don't unstake (stays in-world as RESTING)
    uint256 kamiID = _mintKami(alice);
    uint32 kamiIndex = LibKami.getIndex(components, kamiID);

    // Listing should fail — kami not 721_EXTERNAL
    vm.startPrank(alice.owner);
    vm.expectRevert();
    _KamiMarketListSystem.executeTyped(kamiIndex, LIST_PRICE, 0);
    vm.stopPrank();
  }

  /////////////////
  // INSUFFICIENT ETH TEST

  function testInsufficientETH() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    // Bob doesn't have enough ETH
    vm.deal(bob.owner, 0.5 ether);
    vm.expectRevert();
    _buyKami(bob, orderID, 0.5 ether);
  }

  /////////////////
  // DISABLED MARKETPLACE TEST

  function testDisabledMarketplace() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // Disable marketplace
    vm.prank(deployer);
    __KamiMarketRegistrySystem.setEnabled(false);

    // List should fail
    vm.startPrank(alice.owner);
    vm.expectRevert();
    _KamiMarketListSystem.executeTyped(kamiIndex, LIST_PRICE, 0);
    vm.stopPrank();

    // Re-enable to create a listing, then disable again
    vm.prank(deployer);
    __KamiMarketRegistrySystem.setEnabled(true);

    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    vm.prank(deployer);
    __KamiMarketRegistrySystem.setEnabled(false);

    // Buy should fail
    vm.deal(bob.owner, LIST_PRICE);
    vm.expectRevert();
    _buyKami(bob, orderID, LIST_PRICE);

    // Offer should fail
    _setupWETH(bob, OFFER_PRICE);
    vm.startPrank(bob.owner);
    vm.expectRevert();
    _KamiMarketOfferSystem.executeTypedOffer(kamiIndex, OFFER_PRICE, 0);
    vm.stopPrank();

    // Re-enable marketplace for cleanup
    vm.prank(deployer);
    __KamiMarketRegistrySystem.setEnabled(true);
  }

  /////////////////
  // RELIST AFTER CANCEL

  function testRelistAfterCancel() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // List, cancel, relist
    uint256 orderID1 = _listKami(alice, kamiIndex, LIST_PRICE);
    _cancelOrder(alice, orderID1);

    uint256 kamiID = LibKami.getByIndex(components, kamiIndex);
    assertEq(LibKami.getState(components, kamiID), "721_EXTERNAL");

    // Relist same kami — should succeed
    uint256 orderID2 = _listKami(alice, kamiIndex, 2 ether);
    assertEq(_StateComponent.get(orderID2), "ACTIVE");
    assertEq(_ValueComponent.get(orderID2), 2 ether);
    assertEq(LibKami.getState(components, kamiID), "LISTED");
  }

  /////////////////
  // BUY ALREADY FILLED LISTING

  function testBuyAlreadyFilledListing() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    // Bob buys it
    vm.deal(bob.owner, LIST_PRICE);
    _buyKami(bob, orderID, LIST_PRICE);
    assertEq(_StateComponent.get(orderID), "FILLED");

    // Charlie tries to buy the same filled listing
    vm.deal(charlie.owner, LIST_PRICE);
    vm.expectRevert();
    _buyKami(charlie, orderID, LIST_PRICE);
  }

  /////////////////
  // ACCEPT ALREADY FILLED OFFER

  function testAcceptAlreadyFilledOffer() public {
    (, uint32 kamiIndex1) = _createExternalKami(alice);
    (, uint32 kamiIndex2) = _createExternalKami(alice);

    _setupWETH(bob, OFFER_PRICE);
    uint256 orderID = _offerKami(bob, kamiIndex1, OFFER_PRICE);

    // Alice accepts with kami1
    _acceptOffer(alice, orderID, kamiIndex1);
    assertEq(_StateComponent.get(orderID), "FILLED");

    // Alice tries to accept the same filled offer with kami2 — should fail
    vm.expectRevert();
    _acceptOffer(alice, orderID, kamiIndex2);
  }

  /////////////////
  // BATCH BUY MULTIPLE SELLERS

  function testBatchBuyMultipleSellers() public {
    (, uint32 kamiIndex1) = _createExternalKami(alice);
    (, uint32 kamiIndex2) = _createExternalKami(bob);

    uint256 orderID1 = _listKami(alice, kamiIndex1, 1 ether);
    uint256 orderID2 = _listKami(bob, kamiIndex2, 2 ether);

    uint256 totalPrice = 3 ether;
    vm.deal(charlie.owner, totalPrice);
    uint256 aliceBalBefore = alice.owner.balance;
    uint256 bobBalBefore = bob.owner.balance;

    uint256[] memory ids = new uint256[](2);
    ids[0] = orderID1;
    ids[1] = orderID2;
    _buyKami(charlie, ids, totalPrice);

    // Verify each seller received their correct amount
    uint256 fee1 = (1 ether * 250) / 10000;
    uint256 fee2 = (2 ether * 250) / 10000;
    assertEq(alice.owner.balance - aliceBalBefore, 1 ether - fee1);
    assertEq(bob.owner.balance - bobBalBefore, 2 ether - fee2);
    assertEq(treasury.balance, fee1 + fee2);

    // Both kamis to charlie
    assertEq(LibKami721.getEOAOwner(components, kamiIndex1), charlie.owner);
    assertEq(LibKami721.getEOAOwner(components, kamiIndex2), charlie.owner);
  }

  /////////////////
  // ACCEPT OFFER KAMI MISMATCH

  function testAcceptOfferKamiMismatch() public {
    (, uint32 kamiIndex1) = _createExternalKami(alice);
    (, uint32 kamiIndex2) = _createExternalKami(alice);

    // Bob offers for kami1
    _setupWETH(bob, OFFER_PRICE);
    uint256 orderID = _offerKami(bob, kamiIndex1, OFFER_PRICE);

    // Alice tries to accept with kami2 — should fail (kami mismatch)
    vm.expectRevert();
    _acceptOffer(alice, orderID, kamiIndex2);
  }

  /////////////////
  // CANCEL COLLECTION OFFER

  function testCancelCollectionOffer() public {
    _setupWETH(bob, OFFER_PRICE * 3);
    uint256 orderID = _collectionOffer(bob, OFFER_PRICE, 3);

    assertEq(_StateComponent.get(orderID), "ACTIVE");

    // Bob cancels his collection offer
    _cancelOrder(bob, orderID);

    assertEq(_StateComponent.get(orderID), "CANCELLED");
    // WETH still with Bob (was never escrowed)
    assertEq(weth.balanceOf(bob.owner), OFFER_PRICE * 3);
  }

  /////////////////
  // DUPLICATE LISTING IN BATCH

  function testDuplicateListingInBatch() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    // Try to buy the same listing twice in one batch
    vm.deal(bob.owner, LIST_PRICE * 2);
    uint256[] memory ids = new uint256[](2);
    ids[0] = orderID;
    ids[1] = orderID;

    // First fill succeeds, second should fail (FILLED, not ACTIVE)
    vm.expectRevert();
    _buyKami(bob, ids, LIST_PRICE * 2);
  }

  /////////////////
  // CANCEL ALREADY CANCELLED

  function testCancelAlreadyCancelled() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    _cancelOrder(alice, orderID);
    assertEq(_StateComponent.get(orderID), "CANCELLED");

    // Can't cancel again
    vm.expectRevert();
    _cancelOrder(alice, orderID);
  }

  /////////////////
  // ZERO PRICE VALIDATION

  function testZeroPriceListing() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // Price = 0 should revert
    vm.startPrank(alice.owner);
    vm.expectRevert();
    _KamiMarketListSystem.executeTyped(kamiIndex, 0, 0);
    vm.stopPrank();
  }

  function testZeroPriceOffer() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // Offer with price = 0 should revert
    vm.startPrank(bob.owner);
    vm.expectRevert();
    _KamiMarketOfferSystem.executeTypedOffer(kamiIndex, 0, 0);
    vm.stopPrank();
  }

  /////////////////
  // COLLECTION OFFER QUANTITY OVERFLOW

  function testCollectionOfferQuantityOverflow() public {
    _setupWETH(bob, 100 ether);

    // quantity > int32 max should revert (overflow guard)
    vm.startPrank(bob.owner);
    vm.expectRevert();
    _KamiMarketOfferSystem.executeTypedCollection(OFFER_PRICE, uint32(type(int32).max) + 1, 0);
    vm.stopPrank();
  }

  function testOfferEventNormalizesQuantityForSpecificOffer() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);
    _setupWETH(bob, OFFER_PRICE);

    vm.recordLogs();
    vm.prank(bob.owner);
    uint256 orderID =
      abi.decode(_KamiMarketOfferSystem.execute(abi.encode(false, kamiIndex, OFFER_PRICE, uint32(7), 0)), (uint256));

    Vm.Log memory eventLog = _findWorldEvent(vm.getRecordedLogs(), "KAMI_MARKET_OFFER");
    (, bytes memory values) = abi.decode(eventLog.data, (uint8[], bytes));
    (uint256 eventOrderID,, uint32 eventKamiIndex, uint32 eventQuantity, uint256 eventPrice, uint256 eventExpiry) =
      abi.decode(values, (uint256, uint256, uint32, uint32, uint256, uint256));

    assertEq(eventOrderID, orderID);
    assertEq(eventKamiIndex, kamiIndex);
    assertEq(eventQuantity, 1);
    assertEq(eventPrice, OFFER_PRICE);
    assertEq(eventExpiry, 0);
  }

  function testOfferEventNormalizesKamiIndexForCollectionOffer() public {
    _setupWETH(bob, OFFER_PRICE * 2);

    vm.recordLogs();
    vm.prank(bob.owner);
    uint256 orderID =
      abi.decode(_KamiMarketOfferSystem.execute(abi.encode(true, uint32(777), OFFER_PRICE, uint32(2), 0)), (uint256));

    Vm.Log memory eventLog = _findWorldEvent(vm.getRecordedLogs(), "KAMI_MARKET_OFFER");
    (, bytes memory values) = abi.decode(eventLog.data, (uint8[], bytes));
    (uint256 eventOrderID,, uint32 eventKamiIndex, uint32 eventQuantity, uint256 eventPrice, uint256 eventExpiry) =
      abi.decode(values, (uint256, uint256, uint32, uint32, uint256, uint256));

    assertEq(eventOrderID, orderID);
    assertEq(eventKamiIndex, 0);
    assertEq(eventQuantity, 2);
    assertEq(eventPrice, OFFER_PRICE);
    assertEq(eventExpiry, 0);
  }

  /////////////////
  // DOUBLE LIST SAME KAMI

  function testDoubleListSameKami() public {
    (, uint32 kamiIndex) = _createExternalKami(alice);

    // List the kami
    _listKami(alice, kamiIndex, LIST_PRICE);

    // Try to list again — should fail because kami is now LISTED, not 721_EXTERNAL
    vm.startPrank(alice.owner);
    vm.expectRevert();
    _KamiMarketListSystem.executeTyped(kamiIndex, 2 ether, 0);
    vm.stopPrank();
  }

  /////////////////
  // MAX ORDERS FREED BY CANCEL

  function testMaxOrdersFreedByCancel() public {
    vm.prank(deployer);
    __KamiMarketRegistrySystem.setMaxOrders(2);

    (, uint32 kamiIndex1) = _createExternalKami(alice);
    (, uint32 kamiIndex2) = _createExternalKami(alice);
    (, uint32 kamiIndex3) = _createExternalKami(alice);

    // Create 2 listings (hits max)
    uint256 orderID1 = _listKami(alice, kamiIndex1, LIST_PRICE);
    _listKami(alice, kamiIndex2, LIST_PRICE);

    // 3rd should fail
    vm.startPrank(alice.owner);
    vm.expectRevert();
    _KamiMarketListSystem.executeTyped(kamiIndex3, LIST_PRICE, 0);
    vm.stopPrank();

    // Cancel first listing — frees a slot
    _cancelOrder(alice, orderID1);

    // Now 3rd should succeed
    _listKami(alice, kamiIndex3, LIST_PRICE);
  }
}
