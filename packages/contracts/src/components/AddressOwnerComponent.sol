// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;
import { AddressComponent } from "solecs/components/AddressComponent.sol";

uint256 constant ID = uint256(keccak256("component.address.owner"));

// An EOA used to control an account and own externalized assets
contract AddressOwnerComponent is AddressComponent {
  constructor(address world) AddressComponent(world, ID) {}
}
