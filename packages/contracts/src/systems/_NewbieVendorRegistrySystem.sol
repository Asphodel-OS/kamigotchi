// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibConfig } from "libraries/LibConfig.sol";

uint256 constant ID = uint256(keccak256("system.newbievendor.registry"));

uint256 constant VENDOR_ENTITY = uint256(keccak256("newbie.vendor"));

/// @notice Admin system for Newbie Kami Vendor configuration
contract _NewbieVendorRegistrySystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory) public onlyAdmin(components) returns (bytes memory) {
    return "";
  }

  /// @notice Set the vendor wallet address (holds the kamis for sale)
  function setVendorAddress(address vendor) public onlyAdmin(components) {
    LibConfig.setAddress(components, "NEWBIE_VENDOR_ADDRESS", vendor);
  }

  /// @notice Enable or disable the vendor
  function setEnabled(bool enabled) public onlyAdmin(components) {
    LibConfig.setBool(components, "NEWBIE_VENDOR_ENABLED", enabled);
  }

  /// @notice Set the display cycle duration in seconds (default: 172800 = 48 hours)
  function setCycleDuration(uint256 duration) public onlyAdmin(components) {
    LibConfig.set(components, "NEWBIE_VENDOR_CYCLE", duration);
  }

  /// @notice Set the full pool of kami indices and reset the cycle timer.
  ///         The display window shows 3 kamis at a time, cycling every NEWBIE_VENDOR_CYCLE seconds.
  function setPool(uint256[] memory kamiIndices) public onlyAdmin(components) {
    ValuesComponent(getAddrByID(components, ValuesCompID)).set(VENDOR_ENTITY, kamiIndices);
    TimeStartComponent(getAddrByID(components, TimeStartCompID)).set(VENDOR_ENTITY, block.timestamp);
  }

  /// @notice Append kami indices to the existing pool
  function addToPool(uint256[] memory kamiIndices) public onlyAdmin(components) {
    ValuesComponent valuesComp = ValuesComponent(getAddrByID(components, ValuesCompID));
    uint256[] memory current = valuesComp.has(VENDOR_ENTITY)
      ? valuesComp.get(VENDOR_ENTITY)
      : new uint256[](0);

    uint256[] memory updated = new uint256[](current.length + kamiIndices.length);
    for (uint256 i; i < current.length; i++) updated[i] = current[i];
    for (uint256 i; i < kamiIndices.length; i++) updated[current.length + i] = kamiIndices[i];

    valuesComp.set(VENDOR_ENTITY, updated);
  }
}
