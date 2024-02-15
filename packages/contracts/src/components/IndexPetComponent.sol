// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/Uint32Component.sol";

uint256 constant ID = uint256(keccak256("component.Index.Pet"));

// ERC721 index of a pet
contract IndexPetComponent is Uint32Component {
  constructor(address world) Uint32Component(world, ID) {}
}
