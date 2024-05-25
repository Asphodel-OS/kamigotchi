// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "components/base/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.block.reveal"));

// blockhash that item is to be revealed at
contract BlockRevealComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
