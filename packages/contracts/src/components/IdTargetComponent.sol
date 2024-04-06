// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/Uint256Component.sol";

uint256 constant ID = uint256(keccak256("component.id.target"));

// the Target Entity of something
// in a commit-reveal, it is the target of effect. in a kill log, it is the victim
contract IdTargetComponent is Uint256Component {
  constructor(address world) Uint256Component(world, ID) {}
}
