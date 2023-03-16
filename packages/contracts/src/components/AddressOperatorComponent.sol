// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import { AddressComponent } from "std-contracts/components/AddressComponent.sol";

uint256 constant ID = uint256(keccak256("component.Address.Operator"));

// The address of the ethereum account used for in-game play
contract AddressOperatorComponent is AddressComponent {
  constructor(address world) AddressComponent(world, ID) {}
}
