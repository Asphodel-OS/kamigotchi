// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "components/base/StringBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.subtype"));

// The Subtype of an entity. On Registries this is for taxonomization but the
// field can be extended to other use cases
contract SubtypeComponent is StringBareComponent {
  constructor(address world) StringBareComponent(world, ID) {}

  function hasValue(uint256 id, string memory name) public view returns (bool) {
    return keccak256(getRaw(id)) == keccak256(abi.encode(name));
  }
}
