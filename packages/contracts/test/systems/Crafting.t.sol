// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract CraftingTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function setUpItems() public override {}

  function testRecipeShape() public {
    uint32[] memory inputIndices = new uint32[](1);
    inputIndices[0] = 1;
    uint32[] memory outputIndices = new uint32[](1);
    outputIndices[0] = 1;
    uint256[] memory inputAmts = new uint256[](1);
    inputAmts[0] = 1;
    uint256[] memory outputAmts = new uint256[](1);
    outputAmts[0] = 1;

    // base shape
    vm.prank(deployer);
    __RecipeRegistrySystem.create(
      abi.encode(1, inputIndices, inputAmts, outputIndices, outputAmts, 1, 1)
    );

    // requirement
    vm.prank(deployer);
    __RecipeRegistrySystem.addRequirement(1, "CURR_MIN", "ITEM", 1, 1, "");

    // removal
    vm.prank(deployer);
    __RecipeRegistrySystem.remove(1);
  }

  function testCraftSingle() public {
    uint32 recipeIndex = 1;
    uint32[] memory inputIndices = new uint32[](1);
    inputIndices[0] = 1;
    uint32[] memory outputIndices = new uint32[](1);
    outputIndices[0] = 2;
    uint256[] memory inputAmts = new uint256[](1);
    inputAmts[0] = 3;
    uint256[] memory outputAmts = new uint256[](1);
    outputAmts[0] = 5;

    vm.prank(deployer);
    __RecipeRegistrySystem.create(
      abi.encode(recipeIndex, inputIndices, inputAmts, outputIndices, outputAmts, 1, 10)
    );

    // not enough ingredients
    vm.prank(alice.operator);
    vm.expectRevert();
    _CraftSystem.executeTyped(recipeIndex, 1);

    // give enough ingredients
    _giveItem(alice, 1, 3);

    // not enough stamina
    vm.startPrank(deployer);
    LibStat.setSyncZero(components, "STAMINA", alice.id);
    _TimeLastActionComponent.set(alice.id, block.timestamp);
    vm.stopPrank();
    vm.prank(alice.operator);
    vm.expectRevert("Account: insufficient stamina");
    _CraftSystem.executeTyped(recipeIndex, 1);

    // valid craft
    vm.startPrank(deployer);
    LibStat.sync(components, "STAMINA", 1000, alice.id);
    vm.stopPrank();
    _craft(alice, recipeIndex, 1);
    assertEq(_getItemBal(alice, 2), 5);
  }

  function testCraftMultipleInputs() public {
    uint32 recipeIndex = 1;
    uint32[] memory inputIndices = new uint32[](4);
    inputIndices[0] = 1;
    inputIndices[1] = 2;
    inputIndices[2] = 3;
    inputIndices[3] = 4;
    uint32[] memory outputIndices = new uint32[](1);
    outputIndices[0] = 10;
    uint256[] memory inputAmts = new uint256[](4);
    inputAmts[0] = 2;
    inputAmts[1] = 3;
    inputAmts[2] = 5;
    inputAmts[3] = 7;
    uint256[] memory outputAmts = new uint256[](1);
    outputAmts[0] = 11;

    vm.prank(deployer);
    __RecipeRegistrySystem.create(
      abi.encode(recipeIndex, inputIndices, inputAmts, outputIndices, outputAmts, 0, 0)
    );

    // not enough ingredients (all missing)
    vm.prank(alice.operator);
    vm.expectRevert();
    _CraftSystem.executeTyped(recipeIndex, 1);

    // not enough ingredients (some missing)
    _giveItem(alice, 1, 2);
    _giveItem(alice, 2, 3);
    _giveItem(alice, 3, 1);
    vm.prank(alice.operator);
    vm.expectRevert();
    _CraftSystem.executeTyped(recipeIndex, 1);

    // valid craft (enough ingredients)
    _giveItem(alice, 3, 4);
    _giveItem(alice, 4, 7);
    _craft(alice, recipeIndex, 1);
    assertEq(_getItemBal(alice, 10), 11);
  }

  function testCraftMultipleOutputs() public {
    uint32 recipeIndex = 1;
    uint32[] memory inputIndices = new uint32[](1);
    inputIndices[0] = 1;
    uint32[] memory outputIndices = new uint32[](3);
    outputIndices[0] = 11;
    outputIndices[1] = 12;
    outputIndices[2] = 13;
    uint256[] memory inputAmts = new uint256[](1);
    inputAmts[0] = 1;
    uint256[] memory outputAmts = new uint256[](3);
    outputAmts[0] = 2;
    outputAmts[1] = 3;
    outputAmts[2] = 5;

    vm.prank(deployer);
    __RecipeRegistrySystem.create(
      abi.encode(recipeIndex, inputIndices, inputAmts, outputIndices, outputAmts, 0, 0)
    );

    // not enough ingredients
    vm.prank(alice.operator);
    vm.expectRevert();
    _CraftSystem.executeTyped(recipeIndex, 1);

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
    uint32[] memory inputIndices = new uint32[](inputLength);
    uint256[] memory inputAmts = new uint256[](inputLength);
    for (uint i = 0; i < inputLength; i++) {
      // inputIndices[i] = uint32((_random() % 11) + 1);
      inputIndices[i] = uint32(i + 1);
      inputAmts[i] = _random() % 11;
    }
    uint32[] memory outputIndices = new uint32[](outputLength);
    uint256[] memory outputAmts = new uint256[](outputLength);
    for (uint i = 0; i < outputLength; i++) {
      // outputIndices[i] = uint32((_random() % 19) + 1);
      outputIndices[i] = uint32(i + 1);
      outputAmts[i] = _random() % 19;
    }

    vm.prank(deployer);
    __RecipeRegistrySystem.create(
      abi.encode(recipeIndex, inputIndices, inputAmts, outputIndices, outputAmts, 0, 0)
    );

    // give ingredients
    for (uint i = 0; i < startBal.length; i++) _giveItem(alice, uint32(i), startBal[i]);

    if (!_enoughIngredients(alice, inputIndices, inputAmts, amtToCraft)) {
      // not enough ingredients, failure
      vm.prank(alice.operator);
      vm.expectRevert();
      _CraftSystem.executeTyped(recipeIndex, amtToCraft);
    } else {
      // good craft, success
      _craft(alice, recipeIndex, amtToCraft);

      // subtract input from startBal
      for (uint i = 0; i < inputIndices.length; i++)
        startBal[inputIndices[i]] -= (inputAmts[i] * amtToCraft);
      // add output to startBal
      for (uint i = 0; i < outputIndices.length; i++)
        startBal[outputIndices[i]] += (outputAmts[i] * amtToCraft);
    }

    // check balances
    for (uint i = 0; i < startBal.length; i++)
      assertEq(
        _getItemBal(alice, uint32(i)),
        startBal[i],
        LibString.concat("bal mismatch for ", LibString.toString(i))
      );
  }

  function testCraftCostFuzz(uint8 amtToCraft, uint8 stCost, int8 initialSt) public {
    uint32 recipeIndex = 1;
    uint32[] memory inputIndices = new uint32[](1);
    inputIndices[0] = 1;
    uint32[] memory outputIndices = new uint32[](1);
    outputIndices[0] = 2;
    uint256[] memory inputAmts = new uint256[](1);
    inputAmts[0] = 3;
    uint256[] memory outputAmts = new uint256[](1);
    outputAmts[0] = 5;

    vm.startPrank(deployer);
    __RecipeRegistrySystem.create(
      abi.encode(
        recipeIndex,
        inputIndices,
        inputAmts,
        outputIndices,
        outputAmts,
        1,
        int32(uint32(stCost))
      )
    );
    LibStat.setSyncZero(components, "STAMINA", alice.id);
    int32 currSt = LibStat.sync(components, "STAMINA", initialSt, alice.id);
    vm.stopPrank();
    _giveItem(alice, 1, 3 * uint256(amtToCraft));

    // expected values
    uint256 expectedAmt = amtToCraft * outputAmts[0];
    int32 expectedStCost = int32(uint32(stCost)) * int32(uint32(amtToCraft));

    if (expectedStCost > currSt) {
      vm.prank(alice.operator);
      vm.expectRevert("Account: insufficient stamina");
      _CraftSystem.executeTyped(recipeIndex, amtToCraft);
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
    _CraftSystem.executeTyped(recipeIndex, amt);
  }

  function _enoughIngredients(
    PlayerAccount memory acc,
    uint32[] memory inputIndices,
    uint256[] memory inputAmts,
    uint256 amt
  ) internal view returns (bool) {
    for (uint i = 0; i < inputIndices.length; i++)
      if (_getItemBal(acc, inputIndices[i]) < inputAmts[i] * amt) return false;
    return true;
  }
}
