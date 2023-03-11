// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "std-contracts/components/StringComponent.sol";

uint256 constant ID = uint256(keccak256("component.Affinity"));

// The Affinity of an entity. For Kamis this is Eerie, Insect, Scrap and Mid.
contract AffinityComponent is StringComponent {
  constructor(address world) StringComponent(world, ID) {}

  function hasValue(uint256 id, string memory name) public view returns (bool) {
    return keccak256(getRawValue(id)) == keccak256(abi.encode(name));
  }
}
