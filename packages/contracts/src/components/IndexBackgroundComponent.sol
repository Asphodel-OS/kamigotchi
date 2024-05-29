// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/Uint32Component.sol";

uint256 constant ID = uint256(keccak256("component.index.background"));

// Body is a trait, non-fungible
contract IndexBackgroundComponent is Uint32Component {
  constructor(address world) Uint32Component(world, ID) {}
}
