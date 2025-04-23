// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;
import { AddressComponent } from "solecs/components/AddressComponent.sol";

uint256 constant ID = uint256(keccak256("component.address.operator"));

// An EOA used for "signature-less" in-game play
contract AddressOperatorComponent is AddressComponent {
  constructor(address world) AddressComponent(world, ID) {}
}
