// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "solecs/components/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.rarity"));

// higher raw number, the lower the rarity. imagine it as a % chance of being selected
// 0 values will never be chosen
// total rarity is the sum of all rarities in the pool
contract RarityComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
