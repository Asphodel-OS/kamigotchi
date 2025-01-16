// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract InventoryTest is SetupTemplate {
  Reverter reverter = new Reverter();

  function setUp() public override {
    super.setUp();
  }

  function setUpItems() public override {}

  function testCreate(uint32 index) public {
    vm.assume(index != 0);

    assertEq(LibItem.getByIndex(components, index), 0);

    uint256 id = _createGenericItem(index);
    assertEq(_IndexItemComponent.get(id), index);
    assertEq(LibItem.getByIndex(components, index), id);

    uint256 expectedid = LibItem.genID(index);
    assertEq(expectedid, id);
  }

  function testBalance(uint32 index, uint256 amt) public {
    vm.assume(index != 0);

    // create item
    uint256 regID = _createGenericItem(index);

    // ensure inventory doesn't exist
    assertEq(LibInventory.get(components, alice.id, index), 0);
    assertInvExistence(LibInventory.get(components, alice.id, index), false);
    assertEq(_getItemBal(alice, index), 0);

    // setting balance
    vm.startPrank(deployer);
    uint256 invID = LibInventory.create(components, alice.id, index);
    LibInventory.set(components, invID, amt);
    vm.stopPrank();

    assertInvExistence(invID, true);
    assertInvBalance(alice, index, amt);
  }

  function testChangeBalance(uint32 index, uint256 initialAmt, uint256 nextAmt) public {
    vm.assume(index != 0);

    // create item
    uint256 regID = _createGenericItem(index);

    // increasing initially
    vm.startPrank(deployer);
    LibInventory.incFor(components, alice.id, index, initialAmt);
    vm.stopPrank();
    assertInvBalance(alice, index, initialAmt);

    // decrease to 0
    vm.startPrank(deployer);
    LibInventory.decFor(components, alice.id, index, initialAmt);
    vm.stopPrank();
    assertInvExistence(LibInventory.get(components, alice.id, index), true);
    assertInvBalance(alice, index, 0);

    // increase back to original, test decrease
    vm.startPrank(deployer);
    LibInventory.incFor(components, alice.id, index, initialAmt);
    if (nextAmt > initialAmt) {
      // decreases more than balance, will revert
      vm.expectRevert();
      reverter.decFor(components, alice.id, index, nextAmt);
    } else {
      LibInventory.decFor(components, alice.id, index, nextAmt);
      assertInvBalance(alice, index, initialAmt - nextAmt);
    }
    vm.stopPrank();
  }

  /////////////////
  // ASSERTIONS

  function assertInvExistence(uint256 id, bool exists) public {
    assertEq(exists, LibEntityType.isShape(components, id, "INVENTORY"));
    assertEq(exists, _IndexItemComponent.has(id));
    assertEq(exists, _ValueComponent.has(id));
  }

  function assertInvBalance(PlayerAccount memory acc, uint32 index, uint256 balance) public {
    uint256 id = LibInventory.get(components, acc.id, index);
    assertInvBalance(id, balance);
  }

  function assertInvBalance(uint256 id, uint256 balance) public {
    if (id == 0 || !LibEntityType.isShape(components, id, "INVENTORY"))
      assertInvExistence(id, false);
    else {
      assertTrue(LibEntityType.isShape(components, id, "INVENTORY"));
      assertEq(_ValueComponent.get(id), balance);
    }
  }
}

// needed to ensure reverts are not caught by the immidate next call, but overall call
contract Reverter {
  function decFor(IUint256Component components, uint256 accID, uint32 index, uint256 amt) public {
    LibInventory.decFor(components, accID, index, amt);
  }
}
