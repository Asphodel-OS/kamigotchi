// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { getAddrByID } from "solecs/utils.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { LibListing } from "libraries/LibListing.sol";
import { LibListingRegistry } from "libraries/LibListingRegistry.sol";

// GDA listing price floor + settle-on-buy + per-unit minimum + batch bound.
// Target 60, rate 100/day, decay 0.5: floor = 60 * 0.5^3 = 7.5 -> ceil 8.
contract ListingGDAFloorTest is SetupTemplate {
  uint32 constant ITEM = 100;
  uint32 constant CHEAP_ITEM = 101;
  uint32 constant NPC = 1;
  uint256 constant TARGET = 60;
  int32 constant PERIOD = 86400;
  int32 constant DECAY = 500000; // 0.5 in 1e6
  int32 constant RATE = 100;

  uint256 listingID;

  function setUp() public override {
    super.setUp();
    _createNPC(NPC, 1, "npc1");
    listingID = _createListing(NPC, ITEM, MUSU_INDEX, TARGET);
    _setBuyGDA(ITEM);
    _giveItem(alice, MUSU_INDEX, 1_000_000);
  }

  function setUpItems() public override {
    _createGenericItem(ITEM);
    _createGenericItem(CHEAP_ITEM);
  }

  /////////////////
  // TESTS

  function testGDAPriceAtCreationIsTarget() public {
    assertEq(_price(1), TARGET);
  }

  // below the clamp the curve is untouched: 1 period behind = decay^1
  function testGDAUnclampedRegionUnchanged() public {
    _fastForward(1 days);
    assertEq(_price(1), 30); // 60 * 0.5
  }

  function testGDAFloorHolds() public {
    _fastForward(10 days);
    assertEq(_price(1), 8); // clamped at 60 * 0.5^3 = 7.5 -> ceil 8

    _fastForward(90 days);
    assertEq(_price(1), 8); // still floored, no matter how dormant
  }

  function testGDAPerUnitMinimum() public {
    // low-target listing: floor spot 4 * 0.5^3 = 0.5/unit; a 10-unit batch
    // integral ceils below 10, so the >=1/unit minimum must bind
    _createListing(NPC, CHEAP_ITEM, MUSU_INDEX, 4);
    _setBuyGDA(CHEAP_ITEM);
    _fastForward(30 days);

    uint256 id = LibListingRegistry.get(components, NPC, CHEAP_ITEM);
    uint256 p = LibListing.calcBuyPrice(components, id, 10);
    assertEq(p, 10); // 1 per unit, not the ~6 the raw integral gives
  }

  function testGDABatchTooLargeReverts() public {
    uint256 tooBig = uint256(int256(RATE)) * 100 + 1;
    vm.prank(alice.operator);
    vm.expectRevert("LibListing: batch too large");
    _ListingBuySystem.executeTyped(NPC, _arr32(ITEM), _arr32(uint32(tooBig)));
  }

  function testGDASettleOnBuyForgivesBacklog() public {
    _fastForward(30 days);

    uint256 tsBefore = _timeStart(listingID);
    _buy(alice, NPC, ITEM, 1);
    uint256 tsAfter = _timeStart(listingID);

    // settle advanced TimeStart so the stored deficit is capped at the clamp
    assertGt(tsAfter, tsBefore);
    // and the charged price was the floor
    assertEq(1_000_000 - _getItemBal(alice, MUSU_INDEX), 8);
  }

  // from the floor, ~MAX_DEFICIT_PERIODS * rate purchases walk price back to target
  function testGDARecoveryBoundedAfterSettle() public {
    _fastForward(30 days);

    _buy(alice, NPC, ITEM, 1); // settles: stored deficit now = 3
    _buy(alice, NPC, ITEM, 300); // 3 periods of supply

    uint256 p = _price(1);
    assertGe(p, 58); // back at target (>= tolerates ceil)
    assertLe(p, 63); // and not overshooting materially
  }

  // a fixed-sell listing (no GDA buy side) still works end-to-end: regression that
  // the LibListing changes leave the sell path untouched
  function testSellOnlyListingUnaffected() public {
    uint32 item = CHEAP_ITEM;
    _createListing(NPC, item, MUSU_INDEX, 5);
    vm.prank(deployer);
    __ListingRegistrySystem.setSellFixed(NPC, item);
    _giveItem(alice, item, 3);

    vm.prank(alice.operator);
    _ListingSellSystem.executeTyped(NPC, _arr32(item), _arr32(3));
    assertEq(_getItemBal(alice, item), 0);
    assertEq(_getItemBal(alice, MUSU_INDEX), 1_000_000 + 15); // 3 × fixed 5
  }

  // a SCALED sell on a dormant (deep-deficit) GDA-buy listing prices off the
  // floored buy price without needing settle on the sell path (calcBuyPrice clamps)
  function testScaledSellOnDormantListingUsesFloor() public {
    // sell price = 50% of buy price
    vm.prank(deployer);
    __ListingRegistrySystem.setSellScaled(NPC, ITEM, 500_000_000); // 0.5 in 1e9
    _giveItem(alice, ITEM, 4);
    _fastForward(30 days); // deep deficit -> buy price at floor (8)

    vm.prank(alice.operator);
    _ListingSellSystem.executeTyped(NPC, _arr32(ITEM), _arr32(4));
    // 4 units sold back at 50% of the per-unit floor (8) = ~4*4
    uint256 got = _getItemBal(alice, MUSU_INDEX) - 1_000_000;
    assertGe(got, 1); // priced, not zero; floored not collapsed
    assertLe(got, 16);
  }

  // without new purchases the price drifts back down from target to the floor,
  // halving per period, and parks there
  function testGDARedecayAfterRecovery() public {
    _fastForward(30 days);
    _buy(alice, NPC, ITEM, 301);
    _fastForward(30 days);
    assertEq(_price(1), 8);
  }

  /////////////////
  // UTILS

  function _price(uint256 amt) internal view returns (uint256) {
    return LibListing.calcBuyPrice(components, listingID, amt);
  }

  function _timeStart(uint256 id) internal view returns (uint256) {
    return TimeStartComponent(getAddrByID(components, TimeStartCompID)).safeGet(id);
  }

  function _setBuyGDA(uint32 itemIndex) internal {
    vm.prank(deployer);
    __ListingRegistrySystem.setBuyGDA(NPC, itemIndex, PERIOD, DECAY, RATE, false);
  }

  function _createListing(
    uint32 npcIndex,
    uint32 itemIndex,
    uint32 currency,
    uint256 basePrice
  ) internal returns (uint256) {
    vm.prank(deployer);
    return __ListingRegistrySystem.create(abi.encode(npcIndex, itemIndex, currency, basePrice));
  }

  function _buy(PlayerAccount memory player, uint32 npcIndex, uint32 itemIndex, uint256 amt) internal {
    vm.prank(player.operator);
    _ListingBuySystem.executeTyped(npcIndex, _arr32(itemIndex), _arr32(uint32(amt)));
  }

  // amounts are uint32 at the ListingBuySystem boundary (executeTyped takes uint32[]),
  // so this cast mirrors the real on-chain type — not a truncation risk.
  function _arr32(uint32 v) internal pure returns (uint32[] memory arr) {
    arr = new uint32[](1);
    arr[0] = v;
  }
}
