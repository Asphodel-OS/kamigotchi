// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "components/base/BoolComponent.sol";

uint256 constant ID = uint256(keccak256("components.proxy.Permissions.Mint20"));

contract ProxyPermissionsMint20Component is BoolComponent {
  constructor(address world) BoolComponent(world, ID) {}
}
