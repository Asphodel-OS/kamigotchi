// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { BoolComponent } from "components/base/BoolComponent.sol";

import { ID as IsAccountCompID } from "components/IsAccountComponent.sol";
import { ID as IsPetCompID } from "components/IsPetComponent.sol";
import { ForComponent, ID as ForCompID } from "components/ForComponent.sol";

import { LibArray } from "libraries/utils/LibArray.sol";

/// @notice LibFor is a library for ForComponent
library LibFor {
  using LibString for string;

  /////////////////
  // SHAPES

  /// @notice check if entity IsComp as suggested in ForComp
  function isTarget(
    IUintComp components,
    uint256 targetID,
    uint256 for_
  ) internal view returns (bool) {
    return BoolComponent(getAddrByID(components, for_)).has(targetID);
  }

  function isTargetFor(
    IUintComp components,
    uint256 targetID,
    uint256 forID
  ) internal view returns (bool) {
    return isTarget(components, targetID, get(components, forID));
  }

  /////////////////
  // CHECKERS

  function isFor(IUintComp components, uint256 id, uint256 for_) internal view returns (bool) {
    ForComponent comp = ForComponent(getAddrByID(components, ForCompID));
    return comp.has(id) && comp.get(id) == for_;
  }

  function isForAccount(IUintComp components, uint256 id) internal view returns (bool) {
    return isFor(components, id, IsAccountCompID);
  }

  function isForPet(IUintComp components, uint256 id) internal view returns (bool) {
    return isFor(components, id, IsPetCompID);
  }

  function isAccount(uint256 value) internal pure returns (bool) {
    return value == IsAccountCompID;
  }

  function isPet(uint256 value) internal pure returns (bool) {
    return value == IsPetCompID;
  }

  /////////////////
  // GET + SET

  function get(IUintComp components, uint256 id) internal view returns (uint256) {
    return ForComponent(getAddrByID(components, ForCompID)).get(id);
  }

  function getBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    return ForComponent(getAddrByID(components, ForCompID)).getBatch(ids);
  }

  function set(IUintComp components, uint256 id, uint256 for_) internal {
    ForComponent(getAddrByID(components, ForCompID)).set(id, for_);
  }

  function setFromString(IUintComp components, uint256 id, string memory for_) internal {
    ForComponent(getAddrByID(components, ForCompID)).set(id, fromString(components, for_));
  }

  function unset(IUintComp components, uint256 id) internal {
    ForComponent(getAddrByID(components, ForCompID)).remove(id);
  }

  /////////////////
  // UTILS

  /// @notice splits an array of entityIDs into 2, based on for Acc or Pet
  /// @dev returns accIDs, kamiIDs
  function splitAccAndPet(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory, uint256[] memory) {
    uint256[] memory fors = getBatch(components, ids);
    uint256[] memory accs = new uint256[](ids.length);
    uint256[] memory pets = new uint256[](ids.length);

    uint256 numAccs;
    uint256 numPets;
    for (uint256 i; i < ids.length; i++) {
      if (isAccount(fors[i])) accs[numAccs++] = ids[i];
      else pets[numPets++] = ids[i];
    }

    return (LibArray.resize(accs, numAccs), LibArray.resize(pets, numPets));
  }

  function fromString(
    IUintComp components,
    string memory for_
  ) internal view returns (uint256 value) {
    if (for_.eq("KAMI")) value = IsPetCompID;
    else if (for_.eq("ACCOUNT")) value = IsAccountCompID;
    else revert("LibFor: invalid type");
  }
}
