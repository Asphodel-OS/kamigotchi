// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { BoolComponent } from "solecs/components/BoolComponent.sol";
import { ForComponent, ID as ForCompID } from "components/ForComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

library LibFor {
  using LibString for string;

  /// @notice check if entity IsComp as suggested in ForComp
  function isShape(
    IUintComp components,
    uint256 targetID,
    string memory shape
  ) internal view returns (bool) {
    return LibEntityType.isShape(components, targetID, shape);
  }

  function isShapeFor(
    IUintComp components,
    uint256 targetID,
    uint256 forID
  ) internal view returns (bool) {
    return isShape(components, targetID, get(components, forID));
  }

  /////////////////
  // GETTERS

  function get(IUintComp components, uint256 id) internal view returns (string memory) {
    return ForComponent(getAddrByID(components, ForCompID)).safeGet(id);
  }

  function get(IUintComp components, uint256[] memory ids) internal view returns (string[] memory) {
    return ForComponent(getAddrByID(components, ForCompID)).safeGet(ids);
  }

  /////////////////
  // SETTERS

  function set(IUintComp components, uint256 id, string memory for_) internal {
    ForComponent(getAddrByID(components, ForCompID)).set(id, for_);
  }

  function remove(IUintComp components, uint256 id) internal {
    ForComponent(getAddrByID(components, ForCompID)).remove(id);
  }

  function remove(IUintComp components, uint256[] memory ids) internal {
    ForComponent(getAddrByID(components, ForCompID)).remove(ids);
  }
}
