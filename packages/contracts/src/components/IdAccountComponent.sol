// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.id.account"));

/// @notice a reference to a Account entity's ID
/// @dev could be depreciated; always can be replaced by HolderID or SourceID
contract IdAccountComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
