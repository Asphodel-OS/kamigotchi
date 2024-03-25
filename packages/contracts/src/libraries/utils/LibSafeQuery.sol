// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IComponent } from "solecs/interfaces/IComponent.sol";

/**
 *  @notice a library for safe, scalable querying with O(1) space reads
 *  - functions in this lib is significantly more limited by design.
 *  @dev
 *  - primary component(s) are components to query for entities with a specific value
 *    - eg Account with a specific name: NameComp (primary) and IsAccount (secondary)
 *  - primary component(s) in array must not be a BareComponent.
 *    - this is unchecked to save gas, will instead throw a general EVM error.
 *  - primary component(s) must not scale globally, either O(1) (ideally) or locally by entity
 */
library LibSafeQuery {
  /// @notice to query a value entry for an entity via IsComponent (eg isAcc)
  /// @dev primary components must be a value without global scaling
  function getIsWithValue(
    IComponent priComp,
    IComponent secComp,
    bytes memory value
  ) internal view returns (uint256[] memory) {
    uint256[] memory hasValue = priComp.getEntitiesWithValue(value);

    uint256 maxLen = hasValue.length;
    uint256 numIs;
    for (uint256 i = 0; i < hasValue.length; i++) {
      if (secComp.has(hasValue[i])) numIs++;
      else hasValue[i] = 0;
    }

    uint256[] memory results = new uint256[](numIs);
    uint256 j;
    for (uint256 i = 0; i < numIs; i++) if (hasValue[i] != 0) results[j++] = hasValue[i];

    return results;
  }
}
