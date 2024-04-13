// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/Int256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.balance.signed"));

// signed version of BalanceComponent - allows negative balances
contract BalanceSignedComponent is Int256BareComponent {
  constructor(address world) Int256BareComponent(world, ID) {}
}
