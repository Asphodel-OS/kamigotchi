// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component } from "./interfaces/IUint256Component.sol";
import { IComponent } from "./interfaces/IComponent.sol";
import { ISystem } from "./interfaces/ISystem.sol";
import { SYSTEMS_COMPONENT_ID } from "./constants.sol";

/// @notice Turn an entity ID into its corresponding Ethereum address.
function entityToAddress(uint256 entity) pure returns (address) {
  return address(uint160(entity));
}

/// @notice Turn an Ethereum address into its corresponding entity ID.
function addressToEntity(address addr) pure returns (uint256) {
  return uint256(uint160(addr));
}

/// @notice Get an Ethereum address from an address/id registry component (like _components/_systems in World.sol)
function getAddrByID(IUint256Component registry, uint256 id) view returns (address) {
  uint256[] memory entities = registry.getEntitiesWithValue(id);
  if (entities.length == 0) revert("id not registered");
  return entityToAddress(entities[0]);
}

/// @notice Get an entity id from an address/id registry component (like _components/_systems in World.sol)
function getIdByAddress(IUint256Component registry, address addr) view returns (uint256 id) {
  id = registry.safeGet(addressToEntity(addr));
  if (id == 0) revert("address not registered");
}

/// @notice Get a Component from an address/id registry component (like _components in World.sol)
function getCompByID(IUint256Component components, uint256 id) view returns (IComponent) {
  return IComponent(getAddrByID(components, id));
}

/** @notice
 * Get the Ethereum address of a System from an address/id component registry component in which the
 * System registry component is registered (like _components in World.sol)
 */
function getSystemAddressById(IUint256Component components, uint256 id) view returns (address) {
  IUint256Component systems = IUint256Component(getAddrByID(components, SYSTEMS_COMPONENT_ID));
  return getAddrByID(systems, id);
}

/** @notice
 * Get a System from an address/id component registry component in which the
 * System registry component is registered (like _components in World.sol)
 */
function getSystemById(IUint256Component components, uint256 id) view returns (ISystem) {
  return ISystem(getSystemAddressById(components, id));
}

/** @notice Split a single bytes blob into an array of bytes of the given length */
function split(bytes memory data, uint8[] memory lengths) pure returns (bytes[] memory) {
  bytes[] memory unpacked = new bytes[](lengths.length);
  uint256 sum = 0;
  for (uint256 i = 0; i < lengths.length; ) {
    unpacked[i] = new bytes(lengths[i]);
    for (uint256 j = 0; j < lengths[i]; ) {
      unchecked {
        unpacked[i][j] = data[sum + j];
        j += 1;
      }
    }
    unchecked {
      sum += lengths[i];
      i += 1;
    }
  }
  return unpacked;
}
