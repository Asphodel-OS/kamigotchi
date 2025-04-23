// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;
import "solecs/components/Uint32ArrayBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.exits"));

// list of exits
contract ExitsComponent is Uint32ArrayBareComponent {
  constructor(address world) Uint32ArrayBareComponent(world, ID) {}
}
