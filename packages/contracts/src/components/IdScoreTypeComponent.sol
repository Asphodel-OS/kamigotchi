// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.id.score.type"));

// IdScoreType is a reverse mapping that points to the entity that describes a score
// this can be a hash(score type, epoch), or an entity like a Goal
contract IdScoreTypeComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
