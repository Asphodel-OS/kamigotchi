// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import "solecs/components/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.id.anchor"));

contract IDAnchorComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
