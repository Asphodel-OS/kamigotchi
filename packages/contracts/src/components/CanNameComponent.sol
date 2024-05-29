// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.can.name"));

contract CanNameComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
