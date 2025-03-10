// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

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
    ExternalCaller.setterUpdate("REPUTATION", 1, 111, alice.id);
    assertEq(LibFactions.getRep(components, alice.id, 1), 111);
  }
}
