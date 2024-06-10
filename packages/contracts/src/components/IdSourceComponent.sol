// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.id.source"));

// the Source Entity of Something
// in a commit-reveal, it is the source of data. in a kill log, it is the killer
contract IdSourceComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
