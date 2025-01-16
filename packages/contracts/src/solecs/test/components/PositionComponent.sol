// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { Component } from "../../Component.sol";
import { LibTypes } from "../../LibTypes.sol";

struct Position {
  int64 x;
  int64 y;
}

uint256 constant ID = uint256(keccak256("mudwar.components.Position"));

contract PositionComponent is Component {
  constructor(address world) Component(world, ID) {}

  function set(uint256 entity, Position calldata value) public {
    _set(entity, abi.encode(value));
  }

  function getValue(uint256 entity) public view returns (Position memory) {
    (int64 x, int64 y) = abi.decode(_getRaw(entity), (int64, int64));
    return Position(x, y);
  }

  function getEntitiesWithValue(Position calldata value) public view returns (uint256[] memory) {
    return _getEntitiesWithValue(abi.encode(value));
  }
}
