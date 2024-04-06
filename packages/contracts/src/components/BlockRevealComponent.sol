// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "components/types/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.block.reveal"));

// blockhash that item is to be revealed at
contract BlockRevealComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
