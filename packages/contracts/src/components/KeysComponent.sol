// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/Uint32ArrayBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.keys"));

contract KeysComponent is Uint32ArrayBareComponent {
  constructor(address world) Uint32ArrayBareComponent(world, ID) {}
}
