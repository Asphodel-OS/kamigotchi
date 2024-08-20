// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { getAddressById } from "solecs/utils.sol";
import { SystemCall } from "./SystemCall.s.sol";

import "forge-std/Script.sol";
import "./Imports.sol";

/// @notice deprecates a system
contract Deprecate is SystemCall {
  function deprecate(
    uint256 deployerPriv,
    address worldAddr,
    address[] memory systemAddrs
  ) external {
    _setUp(worldAddr);

    address deployer = address(uint160(uint256(keccak256(abi.encodePacked(deployerPriv)))));
    vm.startBroadcast(deployerPriv);

    // get all components
    Component[] memory comps = getAllComponents();

    // deprecate
    for (uint256 i; i < systemAddrs.length; i++) {
      console.log("Depreciating system %s", systemAddrs[i]);
      killSystem(systemAddrs[i], comps);
    }
  }

  function getAllComponents() internal view returns (Component[] memory) {
    uint256[] memory componentIDs = getAllComponentIDs();
    Component[] memory comps = new Component[](componentIDs.length);
    for (uint256 i; i < componentIDs.length; i++) {
      console.log("Getting component %s", componentIDs[i]);
      comps[i] = Component(getAddressById(components, componentIDs[i]));
    }
    return comps;
  }

  /// @notice deprecates a system
  function killSystem(address systemAddr, Component[] memory comps) internal {
    ISystem(systemAddr).deprecate();
    for (uint256 i; i < comps.length; i++) {
      if (comps[i].writeAccess(systemAddr)) comps[i].unauthorizeWriter(systemAddr);
    }
  }
}
