// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

import { ROOM as NAMING_ROOM } from "systems/PetNameSystem.sol";

contract NamingTest is SetupTemplate {
  function testNamePet(uint32 index) public {
    // setting account room to NAMING_ROOM (11)
    vm.prank(deployer);
    _IndexRoomComponent.set(alice.id, NAMING_ROOM);

    // get a pet
    uint256 petID = _mintPet(alice.index);

    // rename once
    vm.prank(alice.operator);
    _PetNameSystem.executeTyped(petID, "test");
    assertEq(LibPet.getName(components, petID), "test");

    // rename again
    vm.prank(alice.operator);
    vm.expectRevert("PetName: cannot be named");
    _PetNameSystem.executeTyped(petID, "test2");
  }
}
