// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/BoolComponent.sol";

uint256 constant ID = uint256(keccak256("component.is.effect"));

// e.g. skill effect
contract IsEffectComponent is BoolComponent {
  constructor(address world) BoolComponent(world, ID) {}
}
