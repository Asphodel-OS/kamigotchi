// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;
import "solecs/components/CoordComponent.sol";

uint256 constant ID = uint256(keccak256("component.location"));

contract LocationComponent is CoordComponent {
  constructor(address world) CoordComponent(world, ID) {}
}
