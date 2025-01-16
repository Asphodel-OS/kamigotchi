// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;
import { Component } from "../../Component.sol";
import { LibTypes } from "../../LibTypes.sol";

contract OwnedByEntityComponent is Component {
  uint256 public constant ID = uint256(keccak256("lib.ownedByEntity"));

  constructor(address world) Component(world, ID) {}

  function set(uint256 entity, uint256 ownedByEntity) public {
    _set(entity, abi.encode(ownedByEntity));
  }

  function getValue(uint256 entity) public view returns (uint256) {
    return abi.decode(_getRaw(entity), (uint256));
  }

  function getEntitiesWithValue(uint256 ownedByEntity) public view returns (uint256[] memory) {
    return _getEntitiesWithValue(abi.encode(ownedByEntity));
  }
}
