// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

/// @notice basic system testing for systems that are not directly tested elsewhere
/** @dev
 * does not check for any state – just to see if the systems are working
 * uses the default setup template setup (uses template functions when possible)
 * this is to check for the basic world state and ensure no operational errors
 */
contract MiscSystemsTest is SetupTemplate {
  /////////////
  // ACCOUNT

  function testAccountFund() public {
    hoax(alice.owner, 100);
    _AccountFundSystem.ownerToOperator{ value: 100 }();

    hoax(alice.operator, 100);
    _AccountFundSystem.operatorToOwner{ value: 100 }();
  }

  function testAccountSetFarcarsterData() public {
    vm.prank(alice.owner);
    _AccountSetFarcasterDataSystem.executeTyped(1, "data");
  }

  function testAccountSetName() public {
    vm.prank(alice.owner);
    _AccountSetNameSystem.executeTyped("name");
  }

  function testAccountSetOperator() public {
    vm.prank(alice.owner);
    _AccountSetOperatorSystem.executeTyped(_getNextUserAddress());
  }
}
