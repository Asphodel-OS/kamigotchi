// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import { AddressComponent } from "components/types/AddressComponent.sol";

uint256 constant ID = uint256(keccak256("component.Address.Owner"));

// An EOA used to control an account and own externalized assets
contract AddressOwnerComponent is AddressComponent {
  constructor(address world) AddressComponent(world, ID) {}
}
