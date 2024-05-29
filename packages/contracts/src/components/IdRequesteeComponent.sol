// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.id.requestee"));

// a reference to a Requestee entity's ID
contract IdRequesteeComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
