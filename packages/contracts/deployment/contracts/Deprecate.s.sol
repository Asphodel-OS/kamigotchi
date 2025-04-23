// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { getAddrByID } from "solecs/utils.sol";
import { SystemCall } from "deployment/SystemCall.s.sol";

import "forge-std/Script.sol";
import "deployment/Imports.sol";

/// @notice deprecates a system
contract Deprecate is SystemCall {
  function deprecateByID(
    uint256 deployerPriv,
    address worldAddr,
    string[] memory systemIDs
  ) external {
    _setUp(worldAddr);

    address[] memory systemAddrs = new address[](systemIDs.length);
    for (uint256 i; i < systemIDs.length; i++) systemAddrs[i] = _getSysAddr(systemIDs[i]);

    address deployer = address(uint160(uint256(keccak256(abi.encodePacked(deployerPriv)))));
    vm.startBroadcast(deployerPriv);

    _deprecate(systemAddrs);
  }

  function deprecateByAddress(
    uint256 deployerPriv,
    address worldAddr,
    address[] memory systemAddrs
  ) external {
    _setUp(worldAddr);

    address deployer = address(uint160(uint256(keccak256(abi.encodePacked(deployerPriv)))));
    vm.startBroadcast(deployerPriv);

    _deprecate(systemAddrs);
  }

  function _deprecate(address[] memory systemAddrs) internal {
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
      comps[i] = Component(getAddrByID(components, componentIDs[i]));
    }
    return comps;
  }

  /// @notice deprecates a system
  function killSystem(address systemAddr, Component[] memory comps) internal {
    ISystem(systemAddr).deprecate();
    for (uint256 i; i < comps.length; i++) {
      if (comps[i].writeAccess(systemAddr)) comps[i].unauthorizeWriter{ gas: 400000 }(systemAddr);
    }
  }
}
