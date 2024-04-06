// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/BoolComponent.sol";

uint256 constant ID = uint256(keccak256("component.Is.Pet"));

// petspetspetspets
contract IsPetComponent is BoolComponent {
  constructor(address world) BoolComponent(world, ID) {}
}
