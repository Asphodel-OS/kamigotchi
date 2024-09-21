// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { HashComponent, ID as HashCompID } from "components/HashComponent.sol";

/// @notice a general utility library for handling hashes, and a hash component
library LibHash {
  /////////////////
  // SETTERS

  function set(IUintComp components, uint256 id, bytes memory values) internal {
    HashComponent(getAddrByID(components, HashCompID)).set(id, keccak256(values));
  }

  function copy(IUintComp components, uint256 toID, uint256 fromID) internal {
    HashComponent comp = HashComponent(getAddrByID(components, HashCompID));
    comp.set(toID, comp.getRaw(fromID));
  }

  function remove(IUintComp components, uint256 id) internal {
    HashComponent(getAddrByID(components, HashCompID)).remove(id);
  }

  function removeBatch(IUintComp components, uint256[] memory ids) internal {
    HashComponent(getAddrByID(components, HashCompID)).removeBatch(ids);
  }

  /////////////////
  // GETTERS

  function get(IUintComp components, uint256 id) internal view returns (uint256) {
    return HashComponent(getAddrByID(components, HashCompID)).get(id);
  }
}
