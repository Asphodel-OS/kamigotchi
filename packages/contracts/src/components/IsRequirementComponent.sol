// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.is.requirement"));

contract IsRequirementComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
