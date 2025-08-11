// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { SafeCastLib } from "solady/utils/SafeCastLib.sol";

import "tests/utils/SetupTemplate.t.sol";

contract LibCooldownTest is SetupTemplate {
  using SafeCastLib for int256;
  using SafeCastLib for uint256;

  uint256 cooldownTime; // always positive
  uint256 entityID = uint256(keccak256(abi.encodePacked("test.entity")));

  function setUp() public override {
    setUpWorld();
    setUpAuthRoles();

    _setCooldown(100);
    _currTime = 1000000000; // set reasonable time to start at
    vm.warp(_currTime);
    _start(entityID);
  }

  function testCooldownBasic() public {
    // no time passed
    assertTrue(LibCooldown.isActive(components, entityID));
    assertEq(LibCooldown.getCooldown(components, entityID), cooldownTime.toInt256());
    assertEq(_getEndTime(entityID), _currTime + cooldownTime);

    // less time passed
    _fastForward(1);
    assertTrue(LibCooldown.isActive(components, entityID));
    _fastForward(cooldownTime - 2);
    // assertTrue(LibCooldown.isActive(components, entityID));

    // // time at
    // _fastForward(1);
    // assertTrue(LibCooldown.isActive(components, entityID));

    // // time passed
    // _fastForward(1);
    // assertFalse(LibCooldown.isActive(components, entityID));
  }

  function testCooldownIncStart() public {
    int256 delta = 10;

    uint256 ogEnd = _getEndTime(entityID);
    _modify(entityID, delta);
    assertEq(_getEndTime(entityID), _currTime + cooldownTime + delta.toUint256());
  }

  function testCooldownIncDuring() public {
    int256 delta = 10;

    uint256 ogEnd = _getEndTime(entityID);
    _fastForward(cooldownTime / 2);
    _modify(entityID, delta);
    assertEq(_getEndTime(entityID), _currTime + delta.toUint256() + cooldownTime / 2);
  }

  function testCooldownIncAfter() public {
    int256 delta = 10;

    _fastForward(cooldownTime * 2);
    _modify(entityID, delta);
    assertEq(_getEndTime(entityID), _currTime + delta.toUint256());
  }

  function testCooldownDecStart() public {
    int256 delta = -10;

    uint256 ogEnd = _getEndTime(entityID);
    _modify(entityID, delta);
    assertEq(_getEndTime(entityID), _currTime + cooldownTime - (delta * -1).toUint256());
  }

  function testCooldownDecDuring() public {
    int256 delta = -10;

    uint256 ogEnd = _getEndTime(entityID);
    _fastForward(cooldownTime / 2);
    _modify(entityID, delta);
    assertEq(_getEndTime(entityID), _currTime - (delta * -1).toUint256() + cooldownTime / 2);
  }

  function testCooldownDecAfter() public {
    int256 delta = -10;

    _fastForward(cooldownTime * 2);
    _modify(entityID, delta);
    assertEq(_getEndTime(entityID), _currTime - (delta * -1).toUint256());
  }

  /////////////////
  // UTILS

  function _setCooldown(uint256 time) internal {
    _setConfig("KAMI_STANDARD_COOLDOWN", time);
    cooldownTime = time;
  }

  function _setStartTs(uint256 id, uint256 time) internal {
    vm.prank(deployer);
    _TimeLastActionComponent.set(id, time);
  }

  function _start(uint256 id) internal {
    vm.startPrank(deployer);
    LibCooldown.set(components, id);
    vm.stopPrank();
  }

  function _modify(uint256 id, int256 delta) internal {
    vm.startPrank(deployer);
    LibCooldown.modify(components, id, delta);
    vm.stopPrank();
  }

  function _getEndTime(uint256 id) internal view returns (uint256) {
    return _TimeNextComponent.get(id);
  }
}
