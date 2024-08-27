// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { EntityTypeComponent, ID as EntityTypeCompID } from "components/EntityTypeComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";

/// @notice library for handling EntityTypeComponent, a top level component for indicating the type of entity
/// @dev defines the shape; should be declared first
library LibEntityType {
  using LibString for string;
  using LibComp for EntityTypeComponent;

  function set(IUintComp components, uint256 id, string memory type_) internal {
    EntityTypeComponent(getAddressById(components, EntityTypeCompID)).set(id, type_);
  }

  function remove(IUintComp components, uint256 id) internal {
    EntityTypeComponent(getAddressById(components, EntityTypeCompID)).remove(id);
  }

  function isShape(
    IUintComp components,
    uint256 id,
    string memory type_
  ) internal view returns (bool) {
    return
      EntityTypeComponent(getAddressById(components, EntityTypeCompID)).safeGetString(id).eq(type_);
  }

  function isShape(
    IUintComp components,
    uint256[] memory ids,
    string memory type_
  ) internal view returns (bool) {
    string[] memory types = EntityTypeComponent(getAddressById(components, EntityTypeCompID))
      .safeGetBatchString(ids);
    for (uint256 i; i < ids.length; i++) if (!types[i].eq(type_)) return false;
    return true;
  }
}
