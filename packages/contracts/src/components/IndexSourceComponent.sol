// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/Uint32Component.sol";

uint256 constant ID = uint256(keccak256("component.Index.Source"));

/// @notice a generic index component for any source entity defined by index
contract IndexSourceComponent is Uint32Component {
  constructor(address world) Uint32Component(world, ID) {}
}
