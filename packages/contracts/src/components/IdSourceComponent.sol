// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;
import "solecs/components/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.id.source"));

// the Source Entity of Something
// in a commit-reveal, it is the source of data. in a kill log, it is the killer
contract IdSourceComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
