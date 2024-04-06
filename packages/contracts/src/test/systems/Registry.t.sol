// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

contract RegistryTest is SetupTemplate {
  function setUpItems() public override {}

  function testDeterminsticIDItem(uint32 index) public {
    uint256 expectedid = LibRegistryItem.genID(index);
    uint256 createdID = _createGenericItem(index);

    assertEq(expectedid, createdID);
  }
}
