// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { EntityTypeComponent, ID as EntityTypeCompID } from "components/EntityTypeComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";

/// @notice library for handling EntityTypeComponent, a top level component for indicating the type of entity
/// @dev defines the shape; should be declared first
library LibEntityType {
  using LibString for string;
  using LibComp for EntityTypeComponent;

  function set(IUintComp components, uint256 id, string memory type_) internal {
    EntityTypeComponent(getAddrByID(components, EntityTypeCompID)).set(id, type_);
  }

  function remove(IUintComp components, uint256 id) internal {
    EntityTypeComponent(getAddrByID(components, EntityTypeCompID)).remove(id);
  }

  function isShape(
    IUintComp components,
    uint256 id,
    string memory type_
  ) internal view returns (bool) {
    return EntityTypeComponent(getAddrByID(components, EntityTypeCompID)).eqString(id, type_);
  }

  function isShape(
    IUintComp components,
    uint256[] memory ids,
    string memory type_
  ) internal view returns (bool) {
    return EntityTypeComponent(getAddrByID(components, EntityTypeCompID)).eqString(ids, type_);
  }
}
