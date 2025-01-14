// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "solecs/components/ProxyComponent.sol";

uint256 constant ID = uint256(keccak256("components.proxy.Permissions.ERC721"));

/// note: does not follow the typical ProxyComp flow to keep audited code frozen
contract ProxyPermissionsERC721Component is ProxyComponent {
  constructor(address world) ProxyComponent(world, ID) {}
}
