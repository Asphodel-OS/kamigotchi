// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "tests/utils/SetupTemplate.t.sol";

contract FactionTest is SetupTemplate {
  function testRegistryFaction() public {
    uint256 factionID = _createFaction(1, "test", "test");
    assertEq(LibFactions.getByIndex(components, 1), factionID);

    vm.prank(deployer);
    __FactionRegistrySystem.remove(1);
  }

  function testRepIncAccount() public {
    _createFaction(1, "test", "test");

    vm.prank(deployer);
    ExternalCaller.accIncBalOf(alice.id, "REPUTATION", 1, 111);
    assertEq(LibFactions.getRep(components, alice.id, 1), 111);
  }
}
