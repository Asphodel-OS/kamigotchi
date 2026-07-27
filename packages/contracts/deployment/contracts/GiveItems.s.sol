// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { SystemCall } from "deployment/SystemCall.s.sol";
import { console } from "forge-std/console.sol";

import { _DistributeItemSystem } from "systems/_DistributeItemSystem.sol";

// dev utility: distribute an item to a registered account by owner address.
// Usage: stack.sh give <owner> [itemIndex] [amt]
contract GiveItems is SystemCall {
  function run(
    uint256 deployerPriv,
    address worldAddr,
    address owner,
    uint32 itemIndex,
    uint256 amt
  ) external {
    _setUp(worldAddr);

    // accounts are keyed by the owner address (see LibAccount.getByOwner)
    require(
      _getStringComp("component.type.entity").has(uint256(uint160(owner))),
      "GiveItems: no account registered for this owner"
    );

    address[] memory owners = new address[](1);
    owners[0] = owner;
    uint256[] memory amts = new uint256[](1);
    amts[0] = amt;

    vm.startBroadcast(deployerPriv);
    _DistributeItemSystem(_getSysAddr("system.distribute.item")).executeTyped(
      owners,
      itemIndex,
      amts
    );
    vm.stopBroadcast();

    console.log("gave item %d x%d to account of %s", itemIndex, amt, owner);
  }
}
