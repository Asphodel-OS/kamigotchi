// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { BoolComponent } from "solecs/components/BoolComponent.sol";
import { ForStringComponent, ID as ForStringCompID } from "components/ForStringComponent.sol";

uint256 constant ForAccount = uint256(keccak256("for.account"));
uint256 constant ForPet = uint256(keccak256("for.kami"));

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
    return ForStringComponent(getAddrByID(components, ForStringCompID)).safeGet(id);
  }

  function get(IUintComp components, uint256[] memory ids) internal view returns (string[] memory) {
    return ForStringComponent(getAddrByID(components, ForStringCompID)).safeGet(ids);
  }

  /////////////////
  // SETTERS

  function set(IUintComp components, uint256 id, string memory for_) internal {
    ForStringComponent(getAddrByID(components, ForStringCompID)).set(id, for_);
  }

  function remove(IUintComp components, uint256 id) internal {
    ForStringComponent(getAddrByID(components, ForStringCompID)).remove(id);
  }

  function remove(IUintComp components, uint256[] memory ids) internal {
    ForStringComponent(getAddrByID(components, ForStringCompID)).remove(ids);
  }
}
