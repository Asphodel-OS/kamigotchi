// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract InventoryTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function setUpItems() public override {}

  function testInventoryCreate(uint32 index) public {
    vm.assume(index != 0);

    assertEq(LibItem.getByIndex(components, index), 0);

    uint256 id = _createGenericItem(index);
    assertEq(_IndexItemComponent.get(id), index);
    assertEq(LibItem.getByIndex(components, index), id);

    uint256 expectedid = LibItem.genID(index);
    assertEq(expectedid, id);
  }

  function testInventoryBalance(uint32 index, uint256 amt) public {
    vm.assume(index != 0);

    // create item
    uint256 regID = _createGenericItem(index);

    // ensure inventory doesn't exist
    assertEq(LibInventory.get(components, alice.id, index), 0);
    assertInvExistence(LibInventory.get(components, alice.id, index), false);
    assertEq(_getItemBal(alice, index), 0);

    // setting balance
    uint256 invID = _giveItem(alice, index, amt);

    assertInvExistence(invID, true);
    assertBalance(alice, index, amt);
  }

  function testInventoryChangeBalance(uint32 index, uint256 initialAmt, uint256 nextAmt) public {
    vm.assume(index != 0);

    // create item
    uint256 regID = _createGenericItem(index);

    // increasing initially
    vm.startPrank(deployer);
    LibInventory.incFor(components, alice.id, index, initialAmt);
    vm.stopPrank();
    assertBalance(alice, index, initialAmt);

    // decrease to 0
    vm.startPrank(deployer);
    LibInventory.decFor(components, alice.id, index, initialAmt);
    vm.stopPrank();
    assertInvExistence(LibInventory.get(components, alice.id, index), false);
    assertBalance(alice, index, 0);

    // increase back to original, test decrease
    vm.startPrank(deployer);
    if (UINT256_MAX / 2 <= initialAmt) {
      vm.expectRevert(); // ITEM_TOTAL overflow
      ExternalCaller.incFor(alice.id, index, initialAmt);
    } else {
      ExternalCaller.incFor(alice.id, index, initialAmt);
      if (nextAmt > initialAmt) {
        // decreases more than balance, will revert
        vm.expectRevert();
        ExternalCaller.decFor(alice.id, index, nextAmt);
      } else {
        LibInventory.decFor(components, alice.id, index, nextAmt);
        assertBalance(alice, index, initialAmt - nextAmt);
      }
    }
    vm.stopPrank();
  }

  function testInventoryDecrease() public {
    _giveItem(alice, 1, 10);

    // decrease slightly
    _decItem(alice, 1, 1);
    assertBalance(alice, 1, 9);

    // overflow decrease
    vm.expectRevert();
    ExternalCaller.decFor(alice.id, 1, 100);
    assertBalance(alice, 1, 9);

    // decrease to 0
    _decItem(alice, 1, 9);
    assertBalance(alice, 1, 0);
    assertInvExistence(LibInventory.get(components, alice.id, 1), false);
  }

  function testInventoryDecreaseBatch() public {
    _giveItem(alice, 1, 13);
    _giveItem(alice, 2, 17);
    _giveItem(alice, 3, 19);

    uint32[] memory indices = new uint32[](3);
    indices[0] = 1;
    indices[1] = 2;
    indices[2] = 3;
    uint256[] memory amts = new uint256[](3);
    amts[0] = 0;
    amts[1] = 1;
    amts[2] = 2;

    // decrease slightly
    vm.startPrank(deployer);
    LibInventory.decFor(components, alice.id, indices, amts);
    vm.stopPrank();
    assertBalance(alice, 1, 13);
    assertBalance(alice, 2, 16);
    assertBalance(alice, 3, 17);

    // overflow one
    amts[0] = 1;
    amts[1] = 100;
    amts[2] = 2;
    vm.startPrank(deployer);
    vm.expectRevert();
    ExternalCaller.decFor(alice.id, indices, amts);
    vm.stopPrank();
    assertBalance(alice, 1, 13);
    assertBalance(alice, 2, 16);
    assertBalance(alice, 3, 17);

    // decrease one to zero
    amts[0] = 13;
    amts[1] = 0;
    amts[2] = 2;
    vm.startPrank(deployer);
    LibInventory.decFor(components, alice.id, indices, amts);
    vm.stopPrank();
    assertBalance(alice, 1, 0);
    assertBalance(alice, 2, 16);
    assertBalance(alice, 3, 15);
    assertInvExistence(alice, 1, false);
  }

  function testInventoryERC20() public {
    uint32 itemIndex = 1;
    _createGenericItem(itemIndex);
    address tokenAddr = _createERC20("TestToken", "TT");
    _addItemERC20(itemIndex, tokenAddr, 3);

    // trying to increase erc20 balance (fail)
    vm.expectRevert();
    ExternalCaller.incFor(alice.id, itemIndex, 1);

    // mint erc20
    _mintERC20(tokenAddr, 100, alice.owner);

    // spending
    _approveERC20(tokenAddr, alice.owner);
    _decItem(alice, itemIndex, 1);
    assertEq(_getTokenBal(tokenAddr, alice.owner), LibERC20.toTokenUnits(99, 3));
    _decItem(alice, itemIndex, 99);
    assertEq(_getTokenBal(tokenAddr, alice.owner), 0);
  }

  /////////////////
  // ASSERTIONS

  function assertInvExistence(uint256 id, bool exists) public {
    assertEq(exists, LibEntityType.isShape(components, id, "INVENTORY"));
    assertEq(exists, _IndexItemComponent.has(id));
    assertEq(exists, _ValueComponent.has(id));
  }

  function assertInvExistence(PlayerAccount memory acc, uint32 index, bool exists) public {
    uint256 id = LibInventory.get(components, acc.id, index);
    assertInvExistence(id, exists);
  }

  function assertBalance(PlayerAccount memory acc, uint32 index, uint256 balance) public {
    uint256 id = LibInventory.get(components, acc.id, index);
    assertBalance(id, balance);
  }

  function assertBalance(uint256 id, uint256 balance) public {
    if (id == 0 || !LibEntityType.isShape(components, id, "INVENTORY"))
      assertInvExistence(id, false);
    else {
      assertTrue(LibEntityType.isShape(components, id, "INVENTORY"));
      assertEq(_ValueComponent.get(id), balance);
    }
  }
}
