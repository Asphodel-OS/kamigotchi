// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/BoolBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.is.listing"));

// identifies an entity as a merchant Listing
contract IsListingComponent is BoolBareComponent {
  constructor(address world) BoolBareComponent(world, ID) {}
}
