// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { LibString } from "solady/utils/LibString.sol";

import { EntityTypeComponent, ID as EntityTypeCompID } from "components/EntityTypeComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";

/// @notice library for handling EntityTypeComponent, a top level component for indicating the type of entity
/// @dev defines the shape; should be declared first
library LibEntityType {
  using LibString for string;
  using LibComp for EntityTypeComponent;

  /////////////////
  // INTERACTIONS

  function set(IUintComp components, uint256 id, string memory type_) internal {
    EntityTypeComponent(getAddrByID(components, EntityTypeCompID)).set(id, type_);
  }

  function checkAndSet(
    IUintComp components,
    uint256 id,
    string memory type_
  ) internal returns (bool have) {
    EntityTypeComponent comp = EntityTypeComponent(getAddrByID(components, EntityTypeCompID));
    have = comp.safeGetString(id).eq(type_);
    if (!have) comp.set(id, type_);
  }

  function remove(IUintComp components, uint256 id) internal {
    EntityTypeComponent(getAddrByID(components, EntityTypeCompID)).remove(id);
  }

  function remove(IUintComp components, uint256[] memory ids) internal {
    EntityTypeComponent(getAddrByID(components, EntityTypeCompID)).removeBatch(ids);
  }

  function get(IUintComp components, uint256 id) internal view returns (string memory) {
    return EntityTypeComponent(getAddrByID(components, EntityTypeCompID)).get(id);
  }

  /////////////////
  // CHECKERS

  function has(IUintComp components, uint256 id) internal view returns (bool) {
    return EntityTypeComponent(getAddrByID(components, EntityTypeCompID)).has(id);
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

  /// @notice returns a bool array of existence, and a bool indicating if all exists
  /// @dev compliments LibComp
  function isShapeBatchWithAggregate(
    IUintComp components,
    uint256[] memory ids,
    string memory type_
  ) internal view returns (bool[] memory, bool) {
    EntityTypeComponent comp = EntityTypeComponent(getAddrByID(components, EntityTypeCompID));
    string[] memory values = comp.safeGetBatchString(ids);
    bool[] memory result = new bool[](ids.length);
    bool allExist = true;
    for (uint256 i = 0; i < ids.length; i++) {
      result[i] = values[i].eq(type_);
      if (!result[i]) allExist = false;
    }
    return (result, allExist);
  }

  /////////////////
  // QUERIES

  /// @notice queries for entities of type that has value in specified component
  /// @dev equivalent to LibQuery.getIsWithValue
  function queryWithValue(
    IUintComp components,
    string memory type_,
    IComponent queryComp, // must be full component
    bytes memory queryValue
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);

    fragments[0] = QueryFragment(QueryType.HasValue, queryComp, queryValue);
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getCompByID(components, EntityTypeCompID),
      abi.encode(type_)
    );

    return LibQuery.query(fragments);
  }
}
