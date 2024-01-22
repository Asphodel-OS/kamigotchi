// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract LootboxTest is SetupTemplate {
  function setUp() public override {
    super.setUp();

    vm.roll(_currBlock++);
  }

  function setUpItems() public override {
    _createGenericItem(1);
    _createGenericItem(2);
    _createGenericItem(3);
    _createGenericItem(4);
  }

  function testLootboxSingleDT(uint256 startAmt, uint256 useAmt) public {
    uint256[] memory keys = new uint256[](1);
    keys[0] = 1;
    uint256[] memory weights = new uint256[](1);
    weights[0] = 1;

    uint256 lootboxIndex = 10;
    _createLootbox(lootboxIndex, "Lootbox", keys, weights);

    _giveLootbox(0, lootboxIndex, startAmt);
    assertEq(_getItemBalance(0, lootboxIndex), startAmt);

    if (useAmt > 10) {
      address operator = _getOperator(0);
      vm.startPrank(operator);
      vm.expectRevert("LootboxStartReveal: max 10");
      _LootboxStartRevealSystem.executeTyped(lootboxIndex, useAmt);

      assertEq(_getItemBalance(0, lootboxIndex), startAmt);
    } else if (useAmt > startAmt) {
      address operator = _getOperator(0);
      vm.startPrank(operator);
      vm.expectRevert("Inventory: insufficient balance");
      _LootboxStartRevealSystem.executeTyped(lootboxIndex, useAmt);

      assertEq(_getItemBalance(0, lootboxIndex), startAmt);
    } else {
      address operator = _getOperator(0);

      vm.roll(_currBlock);
      vm.prank(operator);
      uint256 revealID = abi.decode(
        _LootboxStartRevealSystem.executeTyped(lootboxIndex, useAmt),
        (uint256)
      );
      assertEq(_IndexItemComponent.getValue(revealID), lootboxIndex);
      assertEq(_BalanceComponent.getValue(revealID), useAmt);
      assertEq(_IdHolderComponent.getValue(revealID), _getAccount(0));
      assertEq(_BlockRevealComponent.getValue(revealID), _currBlock);

      vm.roll(++_currBlock);
      vm.prank(operator);
      _LootboxExecuteRevealSystem.executeTyped(revealID);

      assertEq(_getItemBalance(0, 1), useAmt);
      assertEq(_getItemBalance(0, lootboxIndex), startAmt - useAmt);
    }
  }
}
