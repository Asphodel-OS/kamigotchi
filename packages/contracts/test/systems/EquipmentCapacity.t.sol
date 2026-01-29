// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { Test } from "forge-std/Test.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";
import { LibDeploy } from "deployment/LibDeploy.sol";

import { LibEquipment } from "libraries/LibEquipment.sol";
import { LibKami } from "libraries/LibKami.sol";

import { SlotsComponent, ID as SlotsCompID } from "components/SlotsComponent.sol";
import { Stat } from "solecs/components/types/Stat.sol";

string constant mnemonic = "test test test test test test test test test test test junk";

/// @notice Minimal tests for equipment slot capacity calculation
/// @dev Uses a minimal setup to avoid equipment system dependency issues
contract EquipmentCapacityTest is Test {
  address internal deployer;
  IUint256Component internal components;

  function setUp() public {
    (deployer, ) = deriveRememberKey(mnemonic, 0);
    vm.startPrank(deployer);
    // Deploy world with all components
    LibDeploy.deploy(address(0), deployer, false, true);
    vm.stopPrank();

    // Get components registry
    components = LibDeploy.deploy(address(0), deployer, false, true).components();
  }

  /// @notice Helper to create a fake kami ID for testing
  function _createTestEntity() internal pure returns (uint256) {
    return uint256(keccak256("test.kami.entity"));
  }

  /// @notice Helper to set slots for an entity
  function _setSlots(uint256 entityID, int32 slots) internal {
    vm.prank(deployer);
    SlotsComponent(getAddrByID(components, SlotsCompID)).set(entityID, Stat(slots, 0, 0, slots));
  }

  /////////////////
  // CAPACITY CALCULATION TESTS

  function testCapacityWithZeroSlots() public {
    uint256 entityID = _createTestEntity();
    // No slots set - should return DEFAULT_CAPACITY (1)
    assertEq(LibEquipment.getCapacity(components, entityID), 1, "Zero slots should use default capacity of 1");
  }

  function testCapacityWithOneSlot() public {
    uint256 entityID = _createTestEntity();
    _setSlots(entityID, 1);
    assertEq(LibEquipment.getCapacity(components, entityID), 1, "Should have 1 slot");
  }

  function testCapacityWithTwoSlots() public {
    uint256 entityID = _createTestEntity();
    _setSlots(entityID, 2);
    assertEq(LibEquipment.getCapacity(components, entityID), 2, "Should have 2 slots (like Octahedron body)");
  }

  function testCapacityWithThreeSlots() public {
    uint256 entityID = _createTestEntity();
    _setSlots(entityID, 3);
    assertEq(LibEquipment.getCapacity(components, entityID), 3, "Should have 3 slots");
  }

  function testCapacityWithFiveSlots() public {
    uint256 entityID = _createTestEntity();
    _setSlots(entityID, 5);
    assertEq(LibEquipment.getCapacity(components, entityID), 5, "Should have 5 slots");
  }

  function testCapacityUpdatesWithSlotsComponent() public {
    uint256 entityID = _createTestEntity();

    // Initially no slots set
    assertEq(LibEquipment.getCapacity(components, entityID), 1, "Initial capacity should be 1");

    // Set to 2
    _setSlots(entityID, 2);
    assertEq(LibEquipment.getCapacity(components, entityID), 2, "Capacity should be 2");

    // Update to 4
    _setSlots(entityID, 4);
    assertEq(LibEquipment.getCapacity(components, entityID), 4, "Capacity should update to 4");
  }
}
