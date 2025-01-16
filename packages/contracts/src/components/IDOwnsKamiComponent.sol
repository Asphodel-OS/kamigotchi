// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import "solecs/components/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.id.kami.owns"));

// A reference to a Pet entity's owner ID. Used to represent object ownership in the world
contract IDOwnsKamiComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
