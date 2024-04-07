// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.is.bonus"));

// identifies an entity as a Bonus mapped to another entity
// bonuses can include various stats
contract IsBonusComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
