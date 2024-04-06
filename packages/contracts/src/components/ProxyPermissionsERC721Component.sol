// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/types/BoolComponent.sol";

uint256 constant ID = uint256(keccak256("components.proxy.Permissions.ERC721"));

contract ProxyPermissionsERC721Component is BoolComponent {
  constructor(address world) BoolComponent(world, ID) {}
}
