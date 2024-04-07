// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.is.equipped"));

// Identifies an item (fungible or nonfungible) as equipped to a Holder entity.
// For Kamigotchi, Kamis will be the primary holders.
contract IsEquippedComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
