// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/BoolComponent.sol";

uint256 constant ID = uint256(keccak256("component.Is.Account"));

// identifies an entity as a Account
contract IsAccountComponent is BoolComponent {
  constructor(address world) BoolComponent(world, ID) {}
}
