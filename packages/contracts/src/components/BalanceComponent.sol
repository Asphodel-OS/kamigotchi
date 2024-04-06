// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.balance"));

// balance of.. whatever. typically used for inventory
contract BalanceComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
