// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { HashComponent, ID as HashCompID } from "components/HashComponent.sol";
import { HashReverseComponent, ID as HashRevCompID } from "components/HashReverseComponent.sol";

/// @notice a general utility library for handling hashes, and a hash component
library LibHash {
  /////////////////
  // SETTERS

  function set(IUintComp components, uint256 id, bytes memory values) internal {
    HashComponent(getAddressById(components, HashCompID)).set(id, keccak256(values));
  }

  function setReversable(IUintComp components, uint256 id, bytes memory values) internal {
    uint256 h = uint256(keccak256(values));
    HashComponent(getAddressById(components, HashCompID)).set(id, h);
    HashReverseComponent(getAddressById(components, HashRevCompID)).set(h, id);
  }

  function copy(IUintComp components, uint256 toID, uint256 fromID) internal {
    HashComponent comp = HashComponent(getAddressById(components, HashCompID));
    comp.set(toID, comp.getRawValue(fromID));
  }

  function remove(IUintComp components, uint256 id) internal {
    HashComponent(getAddressById(components, HashCompID)).remove(id);
  }

  function removeReversable(IUintComp components, uint256 id) internal {
    HashComponent hComp = HashComponent(getAddressById(components, HashCompID));
    uint256 h = hComp.getValue(id);
    hComp.remove(id);
    HashReverseComponent(getAddressById(components, HashRevCompID)).remove(h);
  }

  /////////////////
  // GETTERS

  function get(IUintComp components, uint256 id) internal view returns (uint256) {
    return HashComponent(getAddressById(components, HashCompID)).getValue(id);
  }

  function getByReverse(IUintComp components, uint256 h) internal view returns (uint256) {
    HashReverseComponent comp = HashReverseComponent(getAddressById(components, HashRevCompID));
    return comp.has(h) ? comp.getValue(h) : 0;
  }
}
