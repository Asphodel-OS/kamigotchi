// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/CoordComponent.sol";

uint256 constant ID = uint256(keccak256("component.location"));

contract LocationComponent is CoordComponent {
  constructor(address world) CoordComponent(world, ID) {}
}
