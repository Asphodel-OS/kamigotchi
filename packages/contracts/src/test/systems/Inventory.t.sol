// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

contract InventoryTest is SetupTemplate {
  Reverter reverter = new Reverter();

  uint256 defaultAccIndex = 0;
  uint256 defaultAccID;
  address defaultOperator;
  address defaultOwner;

  function setUp() public override {
    super.setUp();

    defaultOwner = _getOwner(defaultAccIndex);
    defaultOperator = _getOperator(defaultAccIndex);
    defaultAccID = _getAccount(defaultAccIndex);
  }

  function setUpItems() public override {}

  function testCreate(uint32 index) public {
    vm.assume(index != 0);

    assertEq(LibItemRegistry.getByIndex(components, index), 0);

    uint256 id = _createGenericItem(index);
    assertEq(_IndexItemComponent.get(id), index);
    assertEq(LibItemRegistry.getByIndex(components, index), id);

    uint256 expectedid = LibItemRegistry.genID(index);
    assertEq(expectedid, id);
  }

  function testBalance(uint32 index, uint256 amt) public {
    vm.assume(index != 0);

    // create item
    uint256 regID = _createGenericItem(index);

    // ensure inventory doesn't exist
    assertEq(LibInventory.get(components, defaultAccID, index), 0);
    assertInvExistence(LibInventory.get(components, defaultAccID, index), false);
    assertEq(_getItemBalance(defaultAccIndex, index), 0);

    // setting balance
    vm.startPrank(deployer);
    uint256 invID = LibInventory.create(components, defaultAccID, index);
    LibInventory.set(components, invID, amt);
    vm.stopPrank();

    assertInvExistence(invID, true);
    assertInvBalance(defaultAccIndex, index, amt);
  }

  function testChangeBalance(uint32 index, uint256 initialAmt, uint256 nextAmt) public {
    vm.assume(index != 0);

    // create item
    uint256 regID = _createGenericItem(index);
    vm.startPrank(deployer);
    uint256 invID = LibInventory.create(components, defaultAccID, index);
    vm.stopPrank();

    // increasing initially
    vm.startPrank(deployer);
    LibInventory.inc(components, invID, initialAmt);
    vm.stopPrank();
    assertInvBalance(defaultAccIndex, index, initialAmt);

    // decrease to 0
    vm.startPrank(deployer);
    LibInventory.dec(components, invID, initialAmt);
    vm.stopPrank();
    assertInvExistence(invID, true);
    assertInvBalance(defaultAccIndex, index, 0);

    // increase back to original, test decrease
    vm.startPrank(deployer);
    LibInventory.inc(components, invID, initialAmt);
    if (nextAmt > initialAmt) {
      // decreases more than balance, will revert
      vm.expectRevert("Inventory: insufficient balance");
      reverter.dec(components, invID, nextAmt);
    } else {
      LibInventory.dec(components, invID, nextAmt);
      assertInvBalance(defaultAccIndex, index, initialAmt - nextAmt);
    }
    vm.stopPrank();
  }

  /////////////////
  // ASSERTIONS

  function assertInvExistence(uint256 id, bool exists) public {
    assertEq(exists, _IsInventoryComponent.has(id));
    assertEq(exists, _IndexItemComponent.has(id));
    assertEq(exists, _BalanceComponent.has(id));
  }

  function assertInvBalance(uint256 accIndex, uint32 index, uint256 balance) public {
    uint256 id = LibInventory.get(components, _getAccount(accIndex), index);
    assertInvBalance(id, balance);
  }

  function assertInvBalance(uint256 id, uint256 balance) public {
    if (id == 0 || !_IsInventoryComponent.has(id)) assertInvExistence(id, false);
    else {
      assertTrue(_IsInventoryComponent.has(id));
      assertEq(_BalanceComponent.get(id), balance);
    }
  }
}

// needed to ensure reverts are not caught by the immidate next call, but overall call
contract Reverter {
  function dec(IUint256Component components, uint256 id, uint256 amt) public {
    LibInventory.dec(components, id, amt);
  }
}
