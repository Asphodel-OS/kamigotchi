// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IComponent } from "./interfaces/IComponent.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getCompByID } from "solecs/utils.sol";

enum QueryType {
  Has,
  Not,
  HasValue,
  NotValue
}

struct QueryFragment {
  QueryType queryType;
  IComponent component;
  bytes value;
}

library LibQuery {
  error QueryOrderNotSupported();

  function query(QueryFragment[] memory fragments) internal view returns (uint256[] memory) {
    if (fragments.length == 0) return new uint256[](0);

    // ensure first query type is HasValue
    if (fragments[0].queryType != QueryType.HasValue) revert QueryOrderNotSupported();

    uint256[] memory entities = fragments[0].component.getEntitiesWithValue(fragments[0].value);

    for (uint256 i = 1; i < fragments.length; i++) entities = checkFragment(fragments[i], entities);

    return entities;
  }

  /// @notice checks if entity fufils query fragment.
  /// @param fragment query fragment to check against
  /// @param entities entities to check
  /// @return results new array of entities that fulfill the query fragment
  function checkFragment(
    QueryFragment memory fragment,
    uint256[] memory entities
  ) internal view returns (uint256[] memory) {
    bytes[] memory values = fragment.component.getRaw(entities);

    uint256 nonZeroVals;
    for (uint256 i; i < values.length; i++) {
      // remove (set to 0) if not fulfilling the query
      if (checkValue(fragment, values[i])) nonZeroVals++;
      else entities[i] = 0;
    }

    return removeZeros(entities, nonZeroVals);
  }

  /// @notice validates query fragment against a value
  /// @param fragment query fragment to check against
  /// @param value value to check against
  /// @return result boolean result of the check
  function checkValue(
    QueryFragment memory fragment,
    bytes memory value
  ) internal pure returns (bool) {
    if (fragment.queryType == QueryType.Has) {
      return value.length > 0;
    } else if (fragment.queryType == QueryType.HasValue) {
      return keccak256(fragment.value) == keccak256(value);
    } else if (fragment.queryType == QueryType.Not) {
      return value.length == 0;
    } else if (fragment.queryType == QueryType.NotValue) {
      return keccak256(fragment.value) != keccak256(value);
    } else {
      revert QueryOrderNotSupported();
    }
  }

  /// @notice removes 0 values in an array
  /// @param entities entities to remove 0 values from
  /// @param numValues number of non-zero values in the array
  /// @return results new array of entities without 0 values
  function removeZeros(
    uint256[] memory entities,
    uint256 numValues
  ) internal pure returns (uint256[] memory) {
    if (numValues == 0) return new uint256[](0);

    uint256[] memory results = new uint256[](numValues);
    uint256 j;
    for (uint256 i = 0; i < entities.length; i++) if (entities[i] != 0) results[j++] = entities[i];

    return results;
  }
}
