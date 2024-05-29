// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.id.target"));

// the Target Entity of something
// in a commit-reveal, it is the target of effect. in a kill log, it is the victim
contract TargetComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
