// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/BoolComponent.sol";

uint256 constant ID = uint256(keccak256("component.Is.Kill"));

// identifies an entity as a kill log instance
contract IsKillComponent is BoolComponent {
  constructor(address world) BoolComponent(world, ID) {}
}
