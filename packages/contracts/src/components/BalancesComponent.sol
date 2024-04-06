// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/Uint256ArrayBareComponent.sol";

uint256 constant ID = uint256(keccak256("component.Balances"));

contract BalancesComponent is Uint256ArrayBareComponent {
  constructor(address world) Uint256ArrayBareComponent(world, ID) {}
}
