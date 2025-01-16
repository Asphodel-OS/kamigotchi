// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import "solecs/components/Uint256ArrayBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.values"));

contract ValuesComponent is Uint256ArrayBareComponent {
  constructor(address world) Uint256ArrayBareComponent(world, ID) {}
}
