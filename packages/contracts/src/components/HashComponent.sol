// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "solecs/components/Uint256BareComponent.sol";
import { TypeLib } from "solecs/components/types/standard.sol";

uint256 constant ID = uint256(keccak256("component.hash"));

/// @notice a generic component to store a hash. context dependent
contract HashComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}

  function set(uint256 id, bytes32 value) public onlyWriter {
    _set(id, TypeLib.encodeUint256(uint256(value)));
  }
}
