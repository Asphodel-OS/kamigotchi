// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.price.buy"));

// buy price of a listing
contract PriceBuyComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
