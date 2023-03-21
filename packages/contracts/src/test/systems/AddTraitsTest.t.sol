// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract AddTraitsTest is SetupTemplate {
  function testAdd() public {
    vm.startPrank(deployer);
    __AddTraitSystem.executeTyped(1, 1, "o", "BODY", "INSECT", "Butterfly");
    vm.stopPrank();
  }
}
