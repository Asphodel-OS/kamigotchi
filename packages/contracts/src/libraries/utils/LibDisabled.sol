// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IsDisabledComponent, ID as IsDisabledCompID } from "components/IsDisabledComponent.sol";

/// @notice handles isDisabled component and logic
library LibDisabled {
  function verifyEnabled(IUintComp components, uint256 id) internal view {
    if (get(components, id)) revert("entity disabled");
  }

  function get(IUintComp components, uint256 id) internal view returns (bool) {
    return IsDisabledComponent(getAddrByID(components, IsDisabledCompID)).has(id);
  }

  function set(IUintComp components, uint256 id, bool disabled) internal {
    if (disabled) IsDisabledComponent(getAddrByID(components, IsDisabledCompID)).set(id);
    else IsDisabledComponent(getAddrByID(components, IsDisabledCompID)).remove(id);
  }
}
