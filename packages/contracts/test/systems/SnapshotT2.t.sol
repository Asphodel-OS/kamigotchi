// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract SnapshotT2Test is SetupTemplate {
  function testSnapshotT2() public {
    address[] memory owners = new address[](2);
    owners[0] = alice.owner;
    owners[1] = bob.owner;
    uint256[] memory amts = new uint256[](2);
    amts[0] = 1;
    amts[1] = 25;

    vm.prank(deployer);
    __SnapshotT2System.distributePassports(abi.encode(owners, amts));
    vm.prank(deployer);
    __SnapshotT2System.whitelistAccounts(abi.encode(owners));
  }
}
