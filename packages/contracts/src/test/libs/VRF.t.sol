// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

contract VRFTest is SetupTemplate {
  function _initVRFConfigs() internal override {}

  function testVRF() public {
    // check seed does not exist
    assertEq(_VRFComponent.safeGet(1), 0);

    // seed
    _seedVRF();

    // pass
    LibCommit.hashSeed(components, 1, 100);
  }

  function testFailVRF() public {
    // check seed does not exist
    assertEq(_VRFComponent.safeGet(1), 0);

    // fail
    LibCommit.hashSeed(components, 1, 100);
  }
}
