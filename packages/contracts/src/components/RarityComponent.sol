// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.rarity"));

// higher raw number, the lower the rarity. imagine it as a % chance of being selected
// 0 values will never be chosen
// total rarity is the sum of all rarities in the pool
contract RarityComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
