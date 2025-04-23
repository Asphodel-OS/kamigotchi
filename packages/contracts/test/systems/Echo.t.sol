// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

/// @notice sync system for re-emitting state, if needed
contract EchoSystemTest is SetupTemplate {
  function testSyncRoom() public {
    vm.prank(alice.operator);
    _EchoRoomSystem.executeTyped();
  }

  function testSyncKami() public {
    _mintKami(alice);
    _mintKami(alice);
    _mintKami(alice);

    vm.prank(alice.operator);
    _EchoKamisSystem.executeTyped();
  }
}
