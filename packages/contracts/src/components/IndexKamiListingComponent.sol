// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;
import "solecs/components/Uint32Component.sol";

uint256 constant ID = uint256(keccak256("component.index.kami.listing"));

/// @notice Indexed kami token index for listing entities only.
contract IndexKamiListingComponent is Uint32Component {
  constructor(address world) Uint32Component(world, ID) {}
}
