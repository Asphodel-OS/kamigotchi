// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;
import { Component } from "../../Component.sol";
import { LibTypes } from "../../LibTypes.sol";

contract TestComponent is Component {
  uint256 public constant ID = uint256(keccak256("lib.testComponent"));

  constructor(address world) Component(world, ID) {}
}

contract TestComponent1 is Component {
  uint256 public constant ID = uint256(keccak256("lib.testComponent1"));

  constructor(address world) Component(world, ID) {}
}

contract TestComponent2 is Component {
  uint256 public constant ID = uint256(keccak256("lib.testComponent2"));

  constructor(address world) Component(world, ID) {}
}

contract TestComponent3 is Component {
  uint256 public constant ID = uint256(keccak256("lib.testComponent3"));

  constructor(address world) Component(world, ID) {}
}

contract TestComponent4 is Component {
  uint256 public constant ID = uint256(keccak256("lib.testComponent4"));

  constructor(address world) Component(world, ID) {}
}
