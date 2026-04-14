// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/systems/Equipment.t.sol";
import { KamiMarketVault } from "tokens/KamiMarketVault.sol";
import { OpenMintable } from "tokens/OpenMintable.sol";
import { LibKamiMarket } from "libraries/LibKamiMarket.sol";
import { LibKami721 } from "libraries/LibKami721.sol";
import { LibCooldown } from "libraries/utils/LibCooldown.sol";
import { ROOM as BRIDGE_721_ROOM } from "systems/Kami721StakeSystem.sol";

/// @notice Regression tests: equipment must be force-unequipped on all transfer paths
/// @dev Covers the bonus duplication bug where equipment bonuses persisted through
///      marketplace listing, buying, sending, and unstaking
contract EquipmentTransferTest is EquipmentTest {
  using SafeCastLib for uint256;

  KamiMarketVault vault;
  OpenMintable weth;
  address treasury;

  uint256 constant LIST_PRICE = 1 ether;

  function setUp() public override {
    super.setUp();

    // Deploy mock WETH + vault for marketplace
    weth = new OpenMintable("Wrapped Ether", "WETH");
    vault = new KamiMarketVault(address(weth), address(LibKami721.getContract(components)), deployer);
    treasury = address(0xFEE);

    vm.startPrank(deployer);
    vault.authorizeCaller(address(_KamiMarketAcceptOfferSystem));
    __KamiMarketRegistrySystem.setVault(address(vault));
    __KamiMarketRegistrySystem.setFeeRecipient(treasury);
    __KamiMarketRegistrySystem.setEnabled(true);
    __KamiMarketRegistrySystem.setPurchaseCooldown(3600);

    uint32[8] memory feeRate;
    feeRate[0] = 4;
    feeRate[1] = 250;
    __KamiMarketRegistrySystem.setFeeRate(feeRate);

    // Authorize systems to write equipment/bonus components (needed for unequipAll)
    address[] memory systems = new address[](4);
    systems[0] = address(_KamiMarketListSystem);
    systems[1] = address(_KamiMarketBuySystem);
    systems[2] = address(_KamiMarketAcceptOfferSystem);
    systems[3] = address(_KamiSendSystem);
    // Kami721UnstakeSystem already has these via its existing equip-adjacent flow

    for (uint256 i; i < systems.length; i++) {
      _authorizeEquipmentComponents(systems[i]);
    }
    _authorizeEquipmentComponents(address(_Kami721UnstakeSystem));

    vm.stopPrank();
  }

  /// @dev Grant write access to all components touched by LibEquipment.unequipAll
  /// In production, this must be configured via the deployment/multisig script
  function _authorizeEquipmentComponents(address sys) internal {
    // LibBonus.unassign
    _IdSourceComponent.authorizeWriter(sys);
    _IDTypeComponent.authorizeWriter(sys);
    _IDAnchorComponent.authorizeWriter(sys);
    _LevelComponent.authorizeWriter(sys);
    _TimeComponent.authorizeWriter(sys);
    // LibEquipment.removeInstance
    _EntityTypeComponent.authorizeWriter(sys);
    _IDOwnsEquipmentComponent.authorizeWriter(sys);
    _IndexItemComponent.authorizeWriter(sys);
    _ForComponent.authorizeWriter(sys);
    // LibInventory.incFor
    _IDOwnsInventoryComponent.authorizeWriter(sys);
    _ValueComponent.authorizeWriter(sys);
  }

  /////////////////
  // HELPERS

  function _createStakedKami(PlayerAccount memory acc) internal returns (uint256 kamiID, uint32 kamiIndex) {
    kamiID = _mintKami(acc);
    kamiIndex = LibKami.getIndex(components, kamiID);
  }

  function _equipPet(PlayerAccount memory acc, uint256 kamiID) internal {
    _giveItem(acc, PETPET_INDEX, 1);
    vm.prank(acc.operator);
    _KamiEquipSystem.executeTyped(kamiID, PETPET_INDEX);
  }

  function _listKami(PlayerAccount memory acc, uint32 kamiIndex, uint256 price) internal returns (uint256 orderID) {
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

  function _cancelOrder(PlayerAccount memory acc, uint256 orderID) internal {
    vm.startPrank(acc.operator);
    _KamiMarketCancelSystem.executeTyped(orderID);
    vm.stopPrank();
  }

  /// @dev Asserts all three invariants: item in inventory, bonus cleared, no equipment instance
  function _assertFullyUnequipped(
    PlayerAccount memory acc,
    uint256 kamiID,
    string memory context
  ) internal {
    // (a) item returned to correct inventory
    assertEq(
      _getItemBal(acc, PETPET_INDEX), 1,
      string.concat(context, ": item not returned to inventory")
    );

    // (b) ON_UNEQUIP_{slot} bonus cleared
    int256 powerBonus = LibBonus.getFor(components, "STAT_POWER_SHIFT", kamiID);
    assertEq(
      powerBonus, 0,
      string.concat(context, ": bonus not cleared")
    );

    // (c) no orphan equipment instance
    uint256[] memory equipped = LibEquipment.getAllEquipped(components, kamiID);
    assertEq(
      equipped.length, 0,
      string.concat(context, ": orphan equipment instance")
    );
  }

  /////////////////
  // MARKETPLACE LISTING

  function testListUnequipsEquipment() public {
    (uint256 kamiID, uint32 kamiIndex) = _createStakedKami(alice);
    _equipPet(alice, kamiID);

    // Verify equipped before listing
    assertEq(_getItemBal(alice, PETPET_INDEX), 0);
    assertTrue(LibEquipment.hasEquipped(components, kamiID, SLOT_PETPET));

    // List kami
    _listKami(alice, kamiIndex, LIST_PRICE);

    // Verify fully unequipped
    _assertFullyUnequipped(alice, kamiID, "list");
    assertEq(LibKami.getState(components, kamiID), "LISTED");
  }

  function testListThenCancelNoOrphanBonus() public {
    (uint256 kamiID, uint32 kamiIndex) = _createStakedKami(alice);
    _equipPet(alice, kamiID);

    int256 powerBefore = LibStat.getTotal(components, "POWER", kamiID);

    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);
    _cancelOrder(alice, orderID);

    // Kami should be RESTING with no bonus and item in inventory
    assertEq(LibKami.getState(components, kamiID), "RESTING");
    _assertFullyUnequipped(alice, kamiID, "list+cancel");

    // Power should be back to base (no bonus)
    int256 powerAfter = LibStat.getTotal(components, "POWER", kamiID);
    assertEq(powerAfter, powerBefore - POWER_BONUS, "power should equal base without bonus");
  }

  /////////////////
  // MARKETPLACE BUY

  function testBuyUnequipsEquipment() public {
    (uint256 kamiID, uint32 kamiIndex) = _createStakedKami(alice);
    _equipPet(alice, kamiID);

    uint256 orderID = _listKami(alice, kamiIndex, LIST_PRICE);

    // Bob buys
    vm.deal(bob.owner, LIST_PRICE);
    _buyKami(bob, orderID, LIST_PRICE);

    // Seller (alice) should have the item back
    _assertFullyUnequipped(alice, kamiID, "buy");

    // Buyer (bob) should own a clean kami
    assertEq(LibKami.getAccount(components, kamiID), bob.id);
    assertEq(LibKami.getState(components, kamiID), "RESTING");
  }

  /////////////////
  // MARKETPLACE ACCEPT OFFER

  function testAcceptOfferUnequipsEquipment() public {
    (uint256 kamiID, uint32 kamiIndex) = _createStakedKami(alice);
    _equipPet(alice, kamiID);

    // Bob makes WETH offer
    weth.mint(bob.owner, LIST_PRICE);
    vm.prank(bob.owner);
    weth.approve(address(vault), type(uint256).max);

    vm.prank(bob.operator);
    uint256 offerID = abi.decode(
      _KamiMarketOfferSystem.executeTypedOffer(kamiIndex, LIST_PRICE, 0),
      (uint256)
    );

    // Alice accepts
    vm.prank(alice.operator);
    _KamiMarketAcceptOfferSystem.executeTyped(offerID, kamiIndex);

    // Seller (alice) should have the item back
    _assertFullyUnequipped(alice, kamiID, "accept-offer");

    // Buyer (bob) owns clean kami
    assertEq(LibKami.getAccount(components, kamiID), bob.id);
  }

  /////////////////
  // KAMI SEND

  function testSendUnequipsEquipment() public {
    (uint256 kamiID, uint32 kamiIndex) = _createStakedKami(alice);
    _equipPet(alice, kamiID);

    // Send to bob
    vm.prank(alice.operator);
    _KamiSendSystem.executeTyped(kamiIndex, bob.operator);

    // Sender (alice) should have the item back
    _assertFullyUnequipped(alice, kamiID, "send");

    // Recipient (bob) should own clean kami
    assertEq(LibKami.getAccount(components, kamiID), bob.id);
    assertEq(LibKami.getState(components, kamiID), "RESTING");
  }

  /////////////////
  // UNSTAKE (BRIDGE OUT)

  function testUnstakeUnequipsEquipment() public {
    (uint256 kamiID, uint32 kamiIndex) = _createStakedKami(alice);
    _equipPet(alice, kamiID);

    // Move to bridge room and unstake
    vm.prank(deployer);
    _IndexRoomComponent.set(alice.id, uint256(BRIDGE_721_ROOM).toUint32());

    vm.prank(alice.owner);
    _Kami721UnstakeSystem.executeTyped(kamiIndex);

    // Item should be back in inventory, no equipment on kami
    assertEq(_getItemBal(alice, PETPET_INDEX), 1, "unstake: item not returned");
    uint256[] memory equipped = LibEquipment.getAllEquipped(components, kamiID);
    assertEq(equipped.length, 0, "unstake: orphan equipment instance");

    // Kami should be external
    assertEq(LibKami.getState(components, kamiID), "721_EXTERNAL");
  }

  /////////////////
  // DUPLICATION PROOF: the original exploit path

  function testCannotDuplicateBonusViaListCancel() public {
    (uint256 kamiA, uint32 kamiAIndex) = _createStakedKami(alice);
    uint256 kamiB = _mintKami(alice);

    // Give alice 1 pet item
    _giveItem(alice, PETPET_INDEX, 1);

    // Equip to kami A
    vm.prank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiA, PETPET_INDEX);

    int256 powerAWithBonus = LibStat.getTotal(components, "POWER", kamiA);

    // List kami A (should force-unequip)
    uint256 orderID = _listKami(alice, kamiAIndex, LIST_PRICE);

    // Cancel listing
    _cancelOrder(alice, orderID);

    // Kami A should NOT have the bonus anymore
    int256 powerAAfter = LibStat.getTotal(components, "POWER", kamiA);
    assertEq(powerAAfter, powerAWithBonus - POWER_BONUS, "kami A should lose bonus after list+cancel");

    // Alice has the pet back in inventory, equip to kami B
    assertEq(_getItemBal(alice, PETPET_INDEX), 1, "pet should be in inventory");
    vm.prank(alice.operator);
    _KamiEquipSystem.executeTyped(kamiB, PETPET_INDEX);

    // Only kami B should have the bonus now
    int256 powerBAfter = LibStat.getTotal(components, "POWER", kamiB);
    int256 powerAFinal = LibStat.getTotal(components, "POWER", kamiA);

    assertTrue(powerBAfter > powerAFinal, "only kami B should have the bonus");
    assertEq(powerAFinal, powerAAfter, "kami A power should not have changed");
  }
}
