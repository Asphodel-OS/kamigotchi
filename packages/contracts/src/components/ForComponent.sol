// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.For"));

// holds a ComponentID and to gate logic by archetype
contract ForComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
