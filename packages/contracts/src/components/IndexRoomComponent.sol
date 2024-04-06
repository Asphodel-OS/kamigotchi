// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "components/types/Uint32Component.sol";

uint256 constant ID = uint256(keccak256("component.index.room"));

// high level roomIndex of an entity (e.g. room number)
contract IndexRoomComponent is Uint32Component {
  constructor(address world) Uint32Component(world, ID) {}
}
