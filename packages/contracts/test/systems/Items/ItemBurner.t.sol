// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "./Item.t.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract ItemBurnerTest is ItemTemplate {
  function testBurnBasic() public {
    _createGenericItem(1); // burnable
    _createGenericItem(2); // not burnable
    vm.startPrank(deployer);
    __ItemRegistrySystem.addFlag(2, "ITEM_UNBURNABLE");
    vm.stopPrank();

    // not enough inventory
    uint32[] memory indices = new uint32[](1);
    indices[0] = 1;
    uint256[] memory amts = new uint256[](1);
    amts[0] = 2;
    vm.prank(alice.operator);
    vm.expectRevert();
    _ItemBurnSystem.executeTyped(indices, amts);
    _giveItem(alice, 1, 1);
    vm.prank(alice.operator);
    vm.expectRevert();
    _ItemBurnSystem.executeTyped(indices, amts);

    // assert burn
    _giveItem(alice, 1, 1);
    vm.prank(alice.operator);
    _ItemBurnSystem.executeTyped(indices, amts);
    assertEq(_getItemBal(alice, 1), 0);
    assertEq(LibData.get(components, alice.id, 1, "ITEM_BURN"), 2);

    // try unburnable
    _giveItem(alice, 1, 1);
    _giveItem(alice, 2, 1);
    indices[0] = 2;
    amts[0] = 1;
    vm.prank(alice.operator);
    vm.expectRevert("item not burnable");
    _ItemBurnSystem.executeTyped(indices, amts);

    // try unburnable (mixed batch)
    indices = new uint32[](2);
    amts = new uint256[](2);
    indices[0] = 1;
    indices[1] = 2;
    amts[0] = 1;
    amts[1] = 1;
    vm.prank(alice.operator);
    vm.expectRevert("item not burnable");
    _ItemBurnSystem.executeTyped(indices, amts);
  }
}
