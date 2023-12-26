// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract BatchMinterTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
    _initCommonTraits();
    _initUncommonTraits();
    _initRareTraits();
    _initEpicTraits();
    _initMythicTraits();
  }

  function testStart() public {
    vm.prank(deployer);
    __721BatchMinterSystem.setTraits();

    vm.prank(deployer);
    __721BatchMinterSystem.batchMint(address(this), 100);
  }
}
