// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "std-contracts/components/StringBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Description.Alt"));

// A second description component. For use if needed
contract DescriptionAltComponent is StringBareComponent {
  constructor(address world) StringBareComponent(world, ID) {}

  function hasValue(uint256 id, string memory name) public view returns (bool) {
    return keccak256(getRawValue(id)) == keccak256(abi.encode(name));
  }
}
