// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/Int256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.value.signed"));

// signed version of ValueComponent - allows negative balances
contract ValueSignedComponent is Int256BareComponent {
  constructor(address world) Int256BareComponent(world, ID) {}
}
