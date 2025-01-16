// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import "solecs/components/Uint32ArrayBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.whitelist"));

// list of whitelisted IDs
contract WhitelistComponent is Uint32ArrayBareComponent {
  constructor(address world) Uint32ArrayBareComponent(world, ID) {}
}
