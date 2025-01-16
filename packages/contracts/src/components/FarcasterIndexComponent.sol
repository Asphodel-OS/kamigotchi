// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import "solecs/components/Uint32Component.sol";

uint256 constant ID = uint256(keccak256("component.index.farcaster"));

// Body is a trait, non-fungible
contract FarcasterIndexComponent is Uint32Component {
  constructor(address world) Uint32Component(world, ID) {}
}
