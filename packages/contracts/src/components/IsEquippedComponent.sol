// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/BoolComponent.sol";

uint256 constant ID = uint256(keccak256("component.Is.Equipped"));

// identifies an item (either fungible or nonfungible) as equipped to a Holder entity
// for Kamigotchi, Kamis will be the primary holders
contract IsEquippedComponent is BoolComponent {
  constructor(address world) BoolComponent(world, ID) {}
}
