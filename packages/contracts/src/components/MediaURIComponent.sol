// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "components/types/StringComponent.sol";

uint256 constant ID = uint256(keccak256("component.mediaURI"));

contract MediaURIComponent is StringComponent {
  constructor(address world) StringComponent(world, ID) {}
}
