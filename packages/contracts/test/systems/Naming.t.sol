// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

// import { ROOM as NAMING_ROOM } from "systems/KamiNameSystem.sol";

contract NamingTest is SetupTemplate {
  // function testNamePet(uint32 index) public {
  //   // setting account room to NAMING_ROOM (11)
  //   vm.prank(deployer);
  //   _IndexRoomComponent.set(alice.id, NAMING_ROOM);
  //   // get a pet
  //   uint256 kamiID = _mintKami(alice.index);
  //   // rename once
  //   vm.prank(alice.operator);
  //   _KamiNameSystem.executeTyped(kamiID, "test");
  //   assertEq(LibKami721.getName(components, kamiID), "test");
  //   // rename again
  //   vm.prank(alice.operator);
  //   vm.expectRevert("PetName: cannot be named");
  //   _KamiNameSystem.executeTyped(kamiID, "test2");
  // }
}
