// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

/** @dev
 * this focuses on the gacha, with a strong emphasis on checking invarients
 * and proper component values
 */
contract GachaTest is SetupTemplate {
  function setUp() public override {
    super.setUp();

    _registerAccounts(10);

    _initStockTraits();
    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.batchMint(1000);
    vm.stopPrank();
  }

  ///////////////
  // LIB TESTS //
  ///////////////

  function testSort(uint256 seed, uint256 length) public {
    length = (length % 100) + 1; // limit sort test :( otherwise is too long

    // fill array with random numbers
    uint256[] memory ogIDs = new uint256[](length);
    uint256[] memory ogIndices = new uint256[](length);
    for (uint256 i = 0; i < length; i++) {
      uint256 id = world.getUniqueEntityId();
      ogIDs[i] = id;
      ogIndices[i] = uint256(keccak256(abi.encode(id, seed)));

      vm.prank(deployer);
      _ValueComponent.set(id, ogIndices[i]);
    }

    // sort
    uint256[] memory sortedIDs = LibGacha.sortCommits(components, ogIDs);

    // check sort
    uint256 curr;
    for (uint256 i = 0; i < length; i++) {
      uint256 val = _ValueComponent.getValue(sortedIDs[i]);
      assertTrue(val >= curr);
      curr = val;
    }
  }
}
