// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/Uint32ArrayBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Blacklist"));

// list of blacklisted IDs
contract BlacklistComponent is Uint32ArrayBareComponent {
  constructor(address world) Uint32ArrayBareComponent(world, ID) {}
}
