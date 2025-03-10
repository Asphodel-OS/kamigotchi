// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "deployment/Imports.sol";

import { SystemCall } from "deployment/SystemCall.s.sol";
import { console } from "forge-std/console.sol";

/// Copy this to GodSystem.s.sol to use
/// @notice a special script that can perform any operation. Useful for testing
contract GodSystem is SystemCall {
  function run(uint256 deployerPriv, address worldAddr) external {
    _setUp(worldAddr);
    vm.startBroadcast(deployerPriv);

    // custom system calls here
  }
}
