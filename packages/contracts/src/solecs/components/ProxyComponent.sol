// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;
import "solecs/BareComponent.sol";

/** @notice
 * proxy components are a workaround for permissioned interactions with out-of-game contracts
 * uses OwnerWritable logic from components, but key-value is unused.
 *
 * expected call flow:
 * system -> proxy (specific system can write) -> external contract (proxyComp can write)
 */
contract ProxyComponent is BareComponent {
  bool public adminFreeze;

  /// @notice emergency stop in case
  modifier isUnfrozen() {
    require(!adminFreeze, "adminFreeze");
    _;
  }

  constructor(address world, uint256 id) BareComponent(world, id) {}

  function setAdminFreeze(bool _adminFreeze) public onlyOwner {
    adminFreeze = _adminFreeze;
  }
}
