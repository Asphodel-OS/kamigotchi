// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract RoomTest is SetupTemplate {
  function testCreateRoom() public {
    uint256[] memory exits = new uint256[](1);
    exits[0] = 1;
    _roomCreate("test", 1, exits);
  }
}
