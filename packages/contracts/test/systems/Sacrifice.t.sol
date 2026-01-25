// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { Test } from "forge-std/Test.sol";
import "tests/systems/Minting/MintTemplate.t.sol";

import { LibSacrifice, SACRIFICE_DT_NORMAL, SACRIFICE_DT_UNCOMMON_PITY, SACRIFICE_DT_RARE_PITY, UNCOMMON_PITY_THRESHOLD, RARE_PITY_THRESHOLD, BURN_ADDRESS } from "libraries/LibSacrifice.sol";

/// @notice Test harness to expose internal LibSacrifice functions
contract LibSacrificeHarness {
  function filterNonZero(
    uint32[] memory indices,
    uint256[] memory amounts
  ) external pure returns (uint32[] memory, uint256[] memory) {
    return LibSacrifice.filterNonZero(indices, amounts);
  }
}
import { KamiSacrificeCommitSystem, ID as SacrificeCommitSystemID } from "systems/KamiSacrificeCommitSystem.sol";
import { KamiSacrificeRevealSystem, ID as SacrificeRevealSystemID } from "systems/KamiSacrificeRevealSystem.sol";
import { _SacrificeRegistrySystem, ID as SacrificeRegistrySystemID } from "systems/_SacrificeRegistrySystem.sol";

contract SacrificeTest is MintTemplate {
  KamiSacrificeCommitSystem _SacrificeCommitSystem;
  KamiSacrificeRevealSystem _SacrificeRevealSystem;

  // Test item indices for rewards
  uint32 constant COMMON_REWARD_INDEX = 201;
  uint32 constant UNCOMMON_REWARD_INDEX = 202;
  uint32 constant RARE_REWARD_INDEX = 203;

  function setUpTraits() public override {
    _initStockTraits();
  }

  function setUpMint() public override {
    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.batchMint(100);
    vm.stopPrank();
  }

  function setUp() public override {
    super.setUp();

    // Deploy and register sacrifice systems
    vm.startPrank(deployer);

    _SacrificeCommitSystem = new KamiSacrificeCommitSystem(world, address(components));
    world.registerSystem(address(_SacrificeCommitSystem), SacrificeCommitSystemID);

    _SacrificeRevealSystem = new KamiSacrificeRevealSystem(world, address(components));
    world.registerSystem(address(_SacrificeRevealSystem), SacrificeRevealSystemID);

    // Authorize systems to write to all components
    _authorizeSystemForComponents(address(_SacrificeCommitSystem));
    _authorizeSystemForComponents(address(_SacrificeRevealSystem));

    vm.stopPrank();

    // Set up reward items and droptables
    _setupRewardItems();
    _setupDroptables();

    vm.roll(_currBlock++);
  }

  function _authorizeSystemForComponents(address system) internal {
    _AddressOperatorComponent.authorizeWriter(system);
    _AddressOwnerComponent.authorizeWriter(system);
    _AffinityComponent.authorizeWriter(system);
    _BalanceComponent.authorizeWriter(system);
    _BlacklistComponent.authorizeWriter(system);
    _BlockRevealComponent.authorizeWriter(system);
    _CacheOperatorComponent.authorizeWriter(system);
    _CostComponent.authorizeWriter(system);
    _DecayComponent.authorizeWriter(system);
    _DescriptionAltComponent.authorizeWriter(system);
    _DescriptionComponent.authorizeWriter(system);
    _EntityTypeComponent.authorizeWriter(system);
    _ExitsComponent.authorizeWriter(system);
    _ExperienceComponent.authorizeWriter(system);
    _ForComponent.authorizeWriter(system);
    _HasFlagComponent.authorizeWriter(system);
    _HarmonyComponent.authorizeWriter(system);
    _HealthComponent.authorizeWriter(system);
    _IDFromComponent.authorizeWriter(system);
    _IdHolderComponent.authorizeWriter(system);
    _IDOwnsFlagComponent.authorizeWriter(system);
    _IDOwnsInventoryComponent.authorizeWriter(system);
    _IDOwnsKamiComponent.authorizeWriter(system);
    _IDOwnsQuestComponent.authorizeWriter(system);
    _IDOwnsRelationshipComponent.authorizeWriter(system);
    _IDOwnsSkillComponent.authorizeWriter(system);
    _IDOwnsTaxComponent.authorizeWriter(system);
    _IDOwnsTradeComponent.authorizeWriter(system);
    _IDOwnsWithdrawalComponent.authorizeWriter(system);
    _IDAnchorComponent.authorizeWriter(system);
    _IdSourceComponent.authorizeWriter(system);
    _IDTypeComponent.authorizeWriter(system);
    _IdTargetComponent.authorizeWriter(system);
    _IDToComponent.authorizeWriter(system);
    _IndexComponent.authorizeWriter(system);
    _IndexAccountComponent.authorizeWriter(system);
    _IndexBackgroundComponent.authorizeWriter(system);
    _IndexBodyComponent.authorizeWriter(system);
    _IndexColorComponent.authorizeWriter(system);
    _IndexCurrencyComponent.authorizeWriter(system);
    _IndexFaceComponent.authorizeWriter(system);
    _IndexFactionComponent.authorizeWriter(system);
    _IndexHandComponent.authorizeWriter(system);
    _IndexItemComponent.authorizeWriter(system);
    _IndexNodeComponent.authorizeWriter(system);
    _IndexNPCComponent.authorizeWriter(system);
    _IndexKamiComponent.authorizeWriter(system);
    _IndexQuestComponent.authorizeWriter(system);
    _IndexRecipeComponent.authorizeWriter(system);
    _IndexRelationshipComponent.authorizeWriter(system);
    _IndexRoomComponent.authorizeWriter(system);
    _IndexSkillComponent.authorizeWriter(system);
    _IsCompleteComponent.authorizeWriter(system);
    _IsDisabledComponent.authorizeWriter(system);
    _IsRegistryComponent.authorizeWriter(system);
    _KeysComponent.authorizeWriter(system);
    _LevelComponent.authorizeWriter(system);
    _LocationComponent.authorizeWriter(system);
    _LogicTypeComponent.authorizeWriter(system);
    _MaxComponent.authorizeWriter(system);
    _MediaURIComponent.authorizeWriter(system);
    _NameComponent.authorizeWriter(system);
    _PeriodComponent.authorizeWriter(system);
    _PowerComponent.authorizeWriter(system);
    _ProxyPermissionsERC721Component.authorizeWriter(system);
    _ProxyVIPScoreComponent.authorizeWriter(system);
    _RarityComponent.authorizeWriter(system);
    _RateComponent.authorizeWriter(system);
    _RerollComponent.authorizeWriter(system);
    _ScaleComponent.authorizeWriter(system);
    _SkillPointComponent.authorizeWriter(system);
    _SlotsComponent.authorizeWriter(system);
    _StaminaComponent.authorizeWriter(system);
    _StateComponent.authorizeWriter(system);
    _SubtypeComponent.authorizeWriter(system);
    _TaxComponent.authorizeWriter(system);
    _TimeComponent.authorizeWriter(system);
    _TimeEndComponent.authorizeWriter(system);
    _TimeLastActionComponent.authorizeWriter(system);
    _TimeNextComponent.authorizeWriter(system);
    _TimeLastComponent.authorizeWriter(system);
    _TimeResetComponent.authorizeWriter(system);
    _TimeStartComponent.authorizeWriter(system);
    _TypeComponent.authorizeWriter(system);
    _TokenAddressComponent.authorizeWriter(system);
    _TokenAllowanceComponent.authorizeWriter(system);
    _TokenHolderComponent.authorizeWriter(system);
    _ValueComponent.authorizeWriter(system);
    _ValuesComponent.authorizeWriter(system);
    _ViolenceComponent.authorizeWriter(system);
    _WeightsComponent.authorizeWriter(system);
    _WhitelistComponent.authorizeWriter(system);
  }

  function _setupRewardItems() internal {
    _createGenericItem(COMMON_REWARD_INDEX, "MATERIAL");
    _createGenericItem(UNCOMMON_REWARD_INDEX, "MATERIAL");
    _createGenericItem(RARE_REWARD_INDEX, "MATERIAL");
  }

  function _setupDroptables() internal {
    vm.startPrank(deployer);

    // Normal droptable - only common items
    uint32[] memory normalKeys = new uint32[](1);
    normalKeys[0] = COMMON_REWARD_INDEX;
    uint256[] memory normalWeights = new uint256[](1);
    normalWeights[0] = 100;

    // Uncommon pity droptable
    uint32[] memory uncommonKeys = new uint32[](1);
    uncommonKeys[0] = UNCOMMON_REWARD_INDEX;
    uint256[] memory uncommonWeights = new uint256[](1);
    uncommonWeights[0] = 100;

    // Rare pity droptable
    uint32[] memory rareKeys = new uint32[](1);
    rareKeys[0] = RARE_REWARD_INDEX;
    uint256[] memory rareWeights = new uint256[](1);
    rareWeights[0] = 100;

    // Use the registry system to set up all droptables
    __SacrificeRegistrySystem.setAllDroptables(
      normalKeys, normalWeights,
      uncommonKeys, uncommonWeights,
      rareKeys, rareWeights
    );

    vm.stopPrank();
  }

  /////////////////
  // BASIC TESTS

  function testSacrificeSingle() public {
    // Mint a kami for alice
    uint256 kamiID = _mintKami(alice);
    uint32 kamiIndex = LibKami.getIndex(components, kamiID);

    // Verify kami is RESTING and owned by alice
    assertEq(LibKami.getState(components, kamiID), "RESTING");
    assertEq(LibKami.getAccount(components, kamiID), alice.id);

    // Get 721 owner before sacrifice
    address tokenOwnerBefore = _Kami721.ownerOf(kamiIndex);
    assertEq(tokenOwnerBefore, address(_Kami721)); // Staked = held by contract

    // Commit sacrifice
    vm.roll(_currBlock++);
    vm.prank(alice.operator);
    uint256 commitID = _SacrificeCommitSystem.executeTyped(kamiIndex);
    assertTrue(commitID != 0, "commitID should not be 0");

    // Verify kami is now DEAD
    assertEq(LibKami.getState(components, kamiID), "DEAD");

    // Verify 721 sent to burn address
    address tokenOwnerAfter = _Kami721.ownerOf(kamiIndex);
    assertEq(tokenOwnerAfter, BURN_ADDRESS, "721 should be sent to burn address");

    // Verify pity counter incremented
    assertEq(LibSacrifice.getPityCount(components, alice.id), 1);

    // Reveal to get reward
    vm.roll(_currBlock++);
    uint256[] memory commitIDs = new uint256[](1);
    commitIDs[0] = commitID;
    vm.prank(alice.operator);
    _SacrificeRevealSystem.executeTypedBatch(commitIDs);

    // Verify reward received (common item)
    assertEq(_getItemBal(alice, COMMON_REWARD_INDEX), 1, "should receive 1 common reward");
  }

  function testSacrificeMultipleSequential() public {
    // Mint multiple kamis
    uint256[] memory kamiIDs = _mintKamis(alice, 3);

    for (uint i = 0; i < kamiIDs.length; i++) {
      uint32 kamiIndex = LibKami.getIndex(components, kamiIDs[i]);

      // Commit
      vm.roll(_currBlock++);
      vm.prank(alice.operator);
      uint256 commitID = _SacrificeCommitSystem.executeTyped(kamiIndex);

      // Reveal
      vm.roll(_currBlock++);
      uint256[] memory commitIDs = new uint256[](1);
      commitIDs[0] = commitID;
      vm.prank(alice.operator);
      _SacrificeRevealSystem.executeTypedBatch(commitIDs);
    }

    // Verify pity counter
    assertEq(LibSacrifice.getPityCount(components, alice.id), 3);

    // Verify rewards
    assertEq(_getItemBal(alice, COMMON_REWARD_INDEX), 3);
  }

  /////////////////
  // PITY SYSTEM TESTS

  function testUncommonPityAt20() public {
    // Need to sacrifice 20 kamis to trigger uncommon pity
    // Sacrifice 19 first (normal rewards)
    for (uint i = 0; i < 19; i++) {
      uint256 kamiID = _mintKami(alice);
      uint32 kamiIndex = LibKami.getIndex(components, kamiID);

      vm.roll(_currBlock++);
      vm.prank(alice.operator);
      uint256 commitID = _SacrificeCommitSystem.executeTyped(kamiIndex);

      vm.roll(_currBlock++);
      uint256[] memory commitIDs = new uint256[](1);
      commitIDs[0] = commitID;
      vm.prank(alice.operator);
      _SacrificeRevealSystem.executeTypedBatch(commitIDs);
    }

    // Verify 19 common rewards
    assertEq(_getItemBal(alice, COMMON_REWARD_INDEX), 19);
    assertEq(_getItemBal(alice, UNCOMMON_REWARD_INDEX), 0);
    assertEq(LibSacrifice.getPityCount(components, alice.id), 19);

    // 20th sacrifice should trigger uncommon pity
    uint256 kamiID20 = _mintKami(alice);
    uint32 kamiIndex20 = LibKami.getIndex(components, kamiID20);

    vm.roll(_currBlock++);
    vm.prank(alice.operator);
    uint256 commitID20 = _SacrificeCommitSystem.executeTyped(kamiIndex20);

    vm.roll(_currBlock++);
    uint256[] memory pityCommitIDs = new uint256[](1);
    pityCommitIDs[0] = commitID20;
    vm.prank(alice.operator);
    _SacrificeRevealSystem.executeTypedBatch(pityCommitIDs);

    // Verify uncommon reward received
    assertEq(_getItemBal(alice, UNCOMMON_REWARD_INDEX), 1, "should receive uncommon reward at 20");
    assertEq(LibSacrifice.getPityCount(components, alice.id), 20);
  }

  function testRarePityAt100() public {
    // Fast-forward pity counter to 99
    vm.startPrank(deployer);
    uint256 pityID = LibSacrifice.genPityID(alice.id);
    _ValueComponent.set(pityID, 99);
    vm.stopPrank();

    // Verify counter is at 99
    assertEq(LibSacrifice.getPityCount(components, alice.id), 99);

    // 100th sacrifice should trigger rare pity
    uint256 kamiID = _mintKami(alice);
    uint32 kamiIndex = LibKami.getIndex(components, kamiID);

    vm.roll(_currBlock++);
    vm.prank(alice.operator);
    uint256 commitID = _SacrificeCommitSystem.executeTyped(kamiIndex);

    vm.roll(_currBlock++);
    uint256[] memory commitIDs = new uint256[](1);
    commitIDs[0] = commitID;
    vm.prank(alice.operator);
    _SacrificeRevealSystem.executeTypedBatch(commitIDs);

    // Verify rare reward received (not uncommon, even though 100 is divisible by 20)
    assertEq(_getItemBal(alice, RARE_REWARD_INDEX), 1, "should receive rare reward at 100");
    assertEq(_getItemBal(alice, UNCOMMON_REWARD_INDEX), 0, "should NOT receive uncommon at 100");
    assertEq(LibSacrifice.getPityCount(components, alice.id), 100);
  }

  function testPityCounterPerAccount() public {
    // Sacrifice with alice
    uint256 aliceKami = _mintKami(alice);
    uint32 aliceKamiIndex = LibKami.getIndex(components, aliceKami);

    // Ensure kami is owned by alice (read state like testSacrificeSingle)
    assertEq(LibKami.getAccount(components, aliceKami), alice.id);

    vm.roll(_currBlock++);
    vm.prank(alice.operator);
    _SacrificeCommitSystem.executeTyped(aliceKamiIndex);

    // Sacrifice with bob
    uint256 bobKami = _mintKami(bob);
    uint32 bobKamiIndex = LibKami.getIndex(components, bobKami);

    // Ensure kami is owned by bob
    assertEq(LibKami.getAccount(components, bobKami), bob.id);

    vm.roll(_currBlock++);
    vm.prank(bob.operator);
    _SacrificeCommitSystem.executeTyped(bobKamiIndex);

    // Each account should have their own counter
    assertEq(LibSacrifice.getPityCount(components, alice.id), 1);
    assertEq(LibSacrifice.getPityCount(components, bob.id), 1);
  }

  /////////////////
  // VALIDATION TESTS

  function testCannotSacrificeNonOwnedKami() public {
    // Mint kami for alice
    uint256 kamiID = _mintKami(alice);
    uint32 kamiIndex = LibKami.getIndex(components, kamiID);

    // Bob tries to sacrifice alice's kami
    vm.roll(_currBlock++);
    vm.prank(bob.operator);
    vm.expectRevert("kami not urs");
    _SacrificeCommitSystem.executeTyped(kamiIndex);
  }

  function testCannotSacrificeNonRestingKami() public {
    // Mint kami and start harvesting
    uint256 kamiID = _mintKami(alice);
    uint32 kamiIndex = LibKami.getIndex(components, kamiID);

    // Start harvest (kami goes to HARVESTING state)
    _startHarvest(kamiID, 1);
    assertEq(LibKami.getState(components, kamiID), "HARVESTING");

    // Try to sacrifice - should fail
    vm.roll(_currBlock++);
    vm.prank(alice.operator);
    vm.expectRevert("kami must be resting");
    _SacrificeCommitSystem.executeTyped(kamiIndex);
  }

  function testCannotSacrificeDeadKami() public {
    // Mint kami and kill it
    uint256 kamiID = _mintKami(alice);
    uint32 kamiIndex = LibKami.getIndex(components, kamiID);

    vm.startPrank(deployer);
    LibKami.setState(components, kamiID, "DEAD");
    vm.stopPrank();

    // Try to sacrifice - should fail
    vm.roll(_currBlock++);
    vm.prank(alice.operator);
    vm.expectRevert("kami must be resting");
    _SacrificeCommitSystem.executeTyped(kamiIndex);
  }

  function testCannotSacrificeNonExistentKami() public {
    // Try to sacrifice a kami that doesn't exist
    vm.roll(_currBlock++);
    vm.prank(alice.operator);
    vm.expectRevert("kami does not exist");
    _SacrificeCommitSystem.executeTyped(99999);
  }

  /////////////////
  // REVEAL TESTS

  function testCannotRevealNonSacrificeCommit() public {
    // Create a lootbox commit (different commit type) - use high index to avoid conflicts
    uint32 lootboxIndex = 999;

    uint32[] memory keys = new uint32[](1);
    keys[0] = COMMON_REWARD_INDEX;
    uint256[] memory weights = new uint256[](1);
    weights[0] = 100;

    vm.startPrank(deployer);
    // Create a consumable lootbox item (this registers the item)
    __ItemRegistrySystem.createConsumable(
      abi.encode(lootboxIndex, "ACCOUNT", "Lootbox", "desc", "LOOTBOX", "media")
    );
    __ItemRegistrySystem.addAlloDT(abi.encode(lootboxIndex, "USE", keys, weights, 1));
    vm.stopPrank();

    // Give alice a lootbox and open it
    _giveItem(alice, lootboxIndex, 1);
    vm.roll(_currBlock++);
    vm.prank(alice.operator);
    _AccountUseItemSystem.executeTyped(lootboxIndex, 1);

    // Get the commit ID (simulated)
    uint256 fakeCommitID = simGetUniqueEntityId() - 1;

    // Try to reveal with sacrifice system - should fail (either due to wrong commit type
    // or because the commit entity doesn't have the expected structure for sacrifice)
    vm.roll(_currBlock++);
    uint256[] memory commitIDs = new uint256[](1);
    commitIDs[0] = fakeCommitID;
    vm.prank(alice.operator);
    vm.expectRevert(); // Expect any revert - the exact error depends on what component lookup fails first
    _SacrificeRevealSystem.executeTypedBatch(commitIDs);
  }

}

contract FilterNonZeroTest is Test {
  LibSacrificeHarness harness;

  function setUp() public {
    harness = new LibSacrificeHarness();
  }

  function testFilterSingleNonZero() public view {
    // Typical sacrifice case: 36 items, only 1 selected
    uint32[] memory indices = new uint32[](5);
    indices[0] = 30001;
    indices[1] = 30002;
    indices[2] = 30003;
    indices[3] = 30004;
    indices[4] = 30005;

    uint256[] memory amounts = new uint256[](5);
    amounts[0] = 0;
    amounts[1] = 0;
    amounts[2] = 1; // Only this one selected
    amounts[3] = 0;
    amounts[4] = 0;

    (uint32[] memory filteredIndices, uint256[] memory filteredAmounts) = harness.filterNonZero(indices, amounts);

    assertEq(filteredIndices.length, 1);
    assertEq(filteredAmounts.length, 1);
    assertEq(filteredIndices[0], 30003);
    assertEq(filteredAmounts[0], 1);
  }

  function testFilterMultipleNonZero() public view {
    uint32[] memory indices = new uint32[](5);
    indices[0] = 100;
    indices[1] = 200;
    indices[2] = 300;
    indices[3] = 400;
    indices[4] = 500;

    uint256[] memory amounts = new uint256[](5);
    amounts[0] = 2;
    amounts[1] = 0;
    amounts[2] = 5;
    amounts[3] = 0;
    amounts[4] = 1;

    (uint32[] memory filteredIndices, uint256[] memory filteredAmounts) = harness.filterNonZero(indices, amounts);

    assertEq(filteredIndices.length, 3);
    assertEq(filteredAmounts.length, 3);
    assertEq(filteredIndices[0], 100);
    assertEq(filteredAmounts[0], 2);
    assertEq(filteredIndices[1], 300);
    assertEq(filteredAmounts[1], 5);
    assertEq(filteredIndices[2], 500);
    assertEq(filteredAmounts[2], 1);
  }

  function testFilterAllZeros() public view {
    uint32[] memory indices = new uint32[](3);
    indices[0] = 1;
    indices[1] = 2;
    indices[2] = 3;

    uint256[] memory amounts = new uint256[](3);
    amounts[0] = 0;
    amounts[1] = 0;
    amounts[2] = 0;

    (uint32[] memory filteredIndices, uint256[] memory filteredAmounts) = harness.filterNonZero(indices, amounts);

    assertEq(filteredIndices.length, 0);
    assertEq(filteredAmounts.length, 0);
  }

  function testFilterAllNonZero() public view {
    uint32[] memory indices = new uint32[](3);
    indices[0] = 10;
    indices[1] = 20;
    indices[2] = 30;

    uint256[] memory amounts = new uint256[](3);
    amounts[0] = 1;
    amounts[1] = 2;
    amounts[2] = 3;

    (uint32[] memory filteredIndices, uint256[] memory filteredAmounts) = harness.filterNonZero(indices, amounts);

    assertEq(filteredIndices.length, 3);
    assertEq(filteredAmounts.length, 3);
    assertEq(filteredIndices[0], 10);
    assertEq(filteredIndices[1], 20);
    assertEq(filteredIndices[2], 30);
    assertEq(filteredAmounts[0], 1);
    assertEq(filteredAmounts[1], 2);
    assertEq(filteredAmounts[2], 3);
  }

  function testFilterEmptyArrays() public view {
    uint32[] memory indices = new uint32[](0);
    uint256[] memory amounts = new uint256[](0);

    (uint32[] memory filteredIndices, uint256[] memory filteredAmounts) = harness.filterNonZero(indices, amounts);

    assertEq(filteredIndices.length, 0);
    assertEq(filteredAmounts.length, 0);
  }

  function testFilterLargeArray() public view {
    // Simulate realistic 36-item droptable with 1 winner
    uint32[] memory indices = new uint32[](36);
    uint256[] memory amounts = new uint256[](36);

    for (uint32 i = 0; i < 36; i++) {
      indices[i] = 30001 + i;
      amounts[i] = 0;
    }
    amounts[17] = 1; // Index 30018 wins

    (uint32[] memory filteredIndices, uint256[] memory filteredAmounts) = harness.filterNonZero(indices, amounts);

    assertEq(filteredIndices.length, 1);
    assertEq(filteredAmounts.length, 1);
    assertEq(filteredIndices[0], 30018);
    assertEq(filteredAmounts[0], 1);
  }
}
