// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import "solecs/components/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.id.type"));

/// @notice reverse mapped types – usually a hashed value of (type, context)
contract IDTypeComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
