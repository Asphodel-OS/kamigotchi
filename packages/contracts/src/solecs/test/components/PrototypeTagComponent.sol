// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;
import { Component } from "../../Component.sol";
import { LibTypes } from "../../LibTypes.sol";

contract PrototypeTagComponent is Component {
  uint256 public constant ID = uint256(keccak256("lib.prototypeTag"));

  constructor(address world) Component(world, ID) {}

  function set(uint256 entity, bool value) public {
    _set(entity, abi.encode(value));
  }

  function getValue(uint256 entity) public view returns (bool) {
    return abi.decode(_getRaw(entity), (bool));
  }

  function getEntitiesWithValue(bool value) public view returns (uint256[] memory) {
    return _getEntitiesWithValue(abi.encode(value));
  }
}
