// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/BoolComponent.sol";

uint256 constant ID = uint256(keccak256("component.Proxy.Permissions.ERC721"));

contract ProxyPermissionsERC721Component is BoolComponent {
  constructor(address world) BoolComponent(world, ID) {}
}
