// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "tests/utils/SetupTemplate.t.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract CraftingTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function setUpItems() public override {}

  function testRecipeShape() public {
    uint32[] memory iIndices = new uint32[](1);
    iIndices[0] = 1;
    uint32[] memory oIndices = new uint32[](1);
    oIndices[0] = 1;
    uint256[] memory iAmounts = new uint256[](1);
    iAmounts[0] = 1;
    uint256[] memory oAmounts = new uint256[](1);
    oAmounts[0] = 1;

    // base shape
    vm.prank(deployer);
    __RecipeRegistrySystem.create(abi.encode(1, iIndices, iAmounts, oIndices, oAmounts, 1, 1));

    // assigner
    vm.prank(deployer);
    __RecipeRegistrySystem.addAssigner(1, 1);

    // requirement
    vm.prank(deployer);
    __RecipeRegistrySystem.addRequirement(1, "CURR_MIN", "ITEM", 1, 1);

    // removal
    vm.prank(deployer);
    __RecipeRegistrySystem.remove(1);
  }

  function testCraftSingle() public {
    uint32 recipeIndex = 1;
    uint32[] memory iIndices = new uint32[](1);
    iIndices[0] = 1;
    uint32[] memory oIndices = new uint32[](1);
    oIndices[0] = 2;
    uint256[] memory iAmounts = new uint256[](1);
    iAmounts[0] = 3;
    uint256[] memory oAmounts = new uint256[](1);
    oAmounts[0] = 5;

    vm.prank(deployer);
    __RecipeRegistrySystem.create(
      abi.encode(recipeIndex, iIndices, iAmounts, oIndices, oAmounts, 1, 1)
    );

    // not enough ingredients
    vm.prank(alice.operator);
    vm.expectRevert();
    _CraftSystem.executeTyped(alice.id, recipeIndex, 1);

    // give enough ingredients
    _giveItem(alice, 1, 3);

    // not enough stamina
    vm.startPrank(deployer);
    LibStat.setSyncZero(components, "STAMINA", alice.id);
    _TimeLastActionComponent.set(alice.id, block.timestamp);
    vm.stopPrank();
    vm.prank(alice.operator);
    vm.expectRevert("Account: insufficient stamina");
    _CraftSystem.executeTyped(alice.id, recipeIndex, 1);

    // valid craft
    vm.startPrank(deployer);
    LibStat.sync(components, "STAMINA", 1000, alice.id);
    vm.stopPrank();
    _craft(alice, recipeIndex, 1);
    assertEq(_getItemBal(alice, 2), 5);
  }

  function testCraftMultipleInputs() public {
    uint32 recipeIndex = 1;
    uint32[] memory iIndices = new uint32[](4);
    iIndices[0] = 1;
    iIndices[1] = 2;
    iIndices[2] = 3;
    iIndices[3] = 4;
    uint32[] memory oIndices = new uint32[](1);
    oIndices[0] = 10;
    uint256[] memory iAmounts = new uint256[](4);
    iAmounts[0] = 2;
    iAmounts[1] = 3;
    iAmounts[2] = 5;
    iAmounts[3] = 7;
    uint256[] memory oAmounts = new uint256[](1);
    oAmounts[0] = 11;

    vm.prank(deployer);
    __RecipeRegistrySystem.create(
      abi.encode(recipeIndex, iIndices, iAmounts, oIndices, oAmounts, 0, 0)
    );

    // not enough ingredients (all missing)
    vm.prank(alice.operator);
    vm.expectRevert();
    _CraftSystem.executeTyped(alice.id, recipeIndex, 1);

    // not enough ingredients (some missing)
    _giveItem(alice, 1, 2);
    _giveItem(alice, 2, 3);
    _giveItem(alice, 3, 1);
    vm.prank(alice.operator);
    vm.expectRevert();
    _CraftSystem.executeTyped(alice.id, recipeIndex, 1);

    // valid craft (enough ingredients)
    _giveItem(alice, 3, 4);
    _giveItem(alice, 4, 7);
    _craft(alice, recipeIndex, 1);
    assertEq(_getItemBal(alice, 10), 11);
  }

  function testCraftMultipleOutputs() public {
    uint32 recipeIndex = 1;
    uint32[] memory iIndices = new uint32[](1);
    iIndices[0] = 1;
    uint32[] memory oIndices = new uint32[](3);
    oIndices[0] = 11;
    oIndices[1] = 12;
    oIndices[2] = 13;
    uint256[] memory iAmounts = new uint256[](1);
    iAmounts[0] = 1;
    uint256[] memory oAmounts = new uint256[](3);
    oAmounts[0] = 2;
    oAmounts[1] = 3;
    oAmounts[2] = 5;

    vm.prank(deployer);
    __RecipeRegistrySystem.create(
      abi.encode(recipeIndex, iIndices, iAmounts, oIndices, oAmounts, 0, 0)
    );

    // not enough ingredients
    vm.prank(alice.operator);
    vm.expectRevert();
    _CraftSystem.executeTyped(alice.id, recipeIndex, 1);

    // valid craft (enough ingredients)
    _giveItem(alice, 1, 1);
    _craft(alice, recipeIndex, 1);
    assertEq(_getItemBal(alice, 11), 2);
    assertEq(_getItemBal(alice, 12), 3);
    assertEq(_getItemBal(alice, 13), 5);
  }

  function testCraftInputFuzz(uint, uint8 amtToCraft) public {
    uint32 recipeIndex = 1;
    uint256[] memory startBal = new uint256[](21); // corresponds to indices 0-20
    for (uint i = 0; i < startBal.length; i++) startBal[i] = _random() / 2;
    uint256 inputLength = (_randomArrayLength() % 11) + 1;
    uint256 outputLength = (_randomArrayLength() % 19) + 1;
    uint32[] memory iIndices = new uint32[](inputLength);
    uint256[] memory iAmounts = new uint256[](inputLength);
    for (uint i = 0; i < inputLength; i++) {
      // iIndices[i] = uint32((_random() % 11) + 1);
      iIndices[i] = uint32(i + 1);
      iAmounts[i] = _random() % 11;
    }
    uint32[] memory oIndices = new uint32[](outputLength);
    uint256[] memory oAmounts = new uint256[](outputLength);
    for (uint i = 0; i < outputLength; i++) {
      // oIndices[i] = uint32((_random() % 19) + 1);
      oIndices[i] = uint32(i + 1);
      oAmounts[i] = _random() % 19;
    }

    vm.prank(deployer);
    __RecipeRegistrySystem.create(
      abi.encode(recipeIndex, iIndices, iAmounts, oIndices, oAmounts, 0, 0)
    );

    // give ingredients
    for (uint i = 0; i < startBal.length; i++) _giveItem(alice, uint32(i), startBal[i]);

    if (!_enoughIngredients(alice, iIndices, iAmounts, amtToCraft)) {
      // not enough ingredients, failure
      vm.prank(alice.operator);
      vm.expectRevert();
      _CraftSystem.executeTyped(alice.id, recipeIndex, amtToCraft);
    } else {
      // good craft, success
      _craft(alice, recipeIndex, amtToCraft);

      // subtract input from startBal
      for (uint i = 0; i < iIndices.length; i++)
        startBal[iIndices[i]] -= (iAmounts[i] * amtToCraft);
      // add output to startBal
      for (uint i = 0; i < oIndices.length; i++)
        startBal[oIndices[i]] += (oAmounts[i] * amtToCraft);
    }

    // check balances
    for (uint i = 0; i < startBal.length; i++)
      assertEq(
        _getItemBal(alice, uint32(i)),
        startBal[i],
        LibString.concat("bal mismatch for ", LibString.toString(i))
      );
  }

  function testCraftCostFuzz(uint8 amtToCraft, int8 stCost, int8 initialSt) public {
    vm.assume(stCost > 0);

    uint32 recipeIndex = 1;
    uint32[] memory iIndices = new uint32[](1);
    iIndices[0] = 1;
    uint32[] memory oIndices = new uint32[](1);
    oIndices[0] = 2;
    uint256[] memory iAmounts = new uint256[](1);
    iAmounts[0] = 3;
    uint256[] memory oAmounts = new uint256[](1);
    oAmounts[0] = 5;

    vm.startPrank(deployer);
    __RecipeRegistrySystem.create(
      abi.encode(recipeIndex, iIndices, iAmounts, oIndices, oAmounts, 1, int32(int(stCost)))
    );
    LibStat.setSyncZero(components, "STAMINA", alice.id);
    int32 currSt = LibStat.sync(components, "STAMINA", initialSt, alice.id);
    vm.stopPrank();
    _giveItem(alice, 1, 3 * uint256(amtToCraft));

    // expected values
    uint256 expectedAmt = amtToCraft * oAmounts[0];
    int32 expectedStCost = int32(int(stCost)) * int32(int(uint256(amtToCraft)));

    if (expectedStCost > currSt) {
      vm.prank(alice.operator);
      vm.expectRevert("Account: insufficient stamina");
      _CraftSystem.executeTyped(alice.id, recipeIndex, amtToCraft);
    } else {
      // valid craft
      _craft(alice, recipeIndex, amtToCraft);
      assertEq(_getItemBal(alice, 2), expectedAmt);
      assertEq(_StaminaComponent.get(alice.id).sync, currSt - expectedStCost);
    }
  }

  /////////////////
  // UTILS

  function _craft(PlayerAccount memory acc, uint32 recipeIndex, uint256 amt) internal {
    vm.prank(acc.operator);
    _CraftSystem.executeTyped(acc.id, recipeIndex, amt);
  }

  function _enoughIngredients(
    PlayerAccount memory acc,
    uint32[] memory iIndices,
    uint256[] memory iAmounts,
    uint256 amt
  ) internal view returns (bool) {
    for (uint i = 0; i < iIndices.length; i++)
      if (_getItemBal(acc, iIndices[i]) < iAmounts[i] * amt) return false;
    return true;
  }
}
