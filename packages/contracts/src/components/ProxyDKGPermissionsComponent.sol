// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "std-contracts/components/Uint256BareComponent.sol";

uint256 constant ID = uint256(keccak256("component.DKG.Proxy"));

// this component is NOT used as a key value store
// it is only used as a reference for system permissions for the DKG contract
// this is to keep it in line with MUD deployers and ride off Components' permission system
// no key value storage to be used here, but doesnt matter if so
contract ProxyDKGPermissionsComponent is Uint256BareComponent {
  constructor(address world) Uint256BareComponent(world, ID) {}
}
