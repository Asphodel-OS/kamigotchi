// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "solecs/components/Uint256BareComponent.sol";

import { TypeLib } from "solecs/components/types/standard.sol";

uint256 constant ID = uint256(keccak256("component.VRF"));

// testnet component for VRF purposes, until we have a real one
contract VRFComponent is Uint256BareComponent {
  uint256 public increment;

  constructor(address world) Uint256BareComponent(world, ID) {}

  function seed(uint256 rand) external onlyWriter {
    uint256 i = ++increment;
    _set(i, TypeLib.encodeUint256(uint256(keccak256(abi.encodePacked(i, rand)))));
  }
}
