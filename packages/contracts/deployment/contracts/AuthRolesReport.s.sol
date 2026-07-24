// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { SystemCall } from "deployment/SystemCall.s.sol";
import { console } from "forge-std/console.sol";

import { Uint256Component } from "solecs/components/Uint256Component.sol";

// Read-only report: who holds which auth role on a live world.
//
// Roles are LibFlag entities: setFull(uint160(addr), "AUTH", role) writes an
// IDType reverse-index anchor keccak("flag.type", "AUTH", role), so holders
// are enumerable without logs or an indexer.
//
// Usage:
//   pnpm roles:local | roles:test | roles:prod
//   (forge script ... --sig 'run(address)' $WORLD --fork-url $RPC, no broadcast)
contract AuthRolesReport is SystemCall {
  function run(address worldAddr) external {
    _setUp(worldAddr);

    console.log("=== AUTH ROLES @ world %s ===", worldAddr);

    // Ownable owner of the World contract (deployer or multisig)
    (bool ok, bytes memory ret) = worldAddr.staticcall(abi.encodeWithSignature("owner()"));
    if (ok && ret.length == 32) console.log("world owner: %s", abi.decode(ret, (address)));

    string[2] memory roles = ["ROLE_ADMIN", "ROLE_COMMUNITY_MANAGER"];
    for (uint256 i; i < roles.length; i++) {
      reportRole(roles[i]);
    }

    // Soundness note: this enumerates grants via the IDType anchor written by
    // _AuthManageRoleSystem.setFull (owner/Safe-gated). That is complete ONLY
    // on worlds where _AdminSetFlagSystem rejects ROLE_ flags (the guard
    // shipped alongside this script). On a world deployed before that guard, an
    // admin could have bare-set a ROLE_ flag with no anchor — invisible here.
    // Treat the list as authoritative post-guard, and as a floor pre-guard.
    console.log("");
    console.log("(anchored grants only; sound iff _AdminSetFlagSystem rejects ROLE_ flags)");
  }

  function reportRole(string memory role) internal {
    uint256 anchor = uint256(keccak256(abi.encodePacked("flag.type", "AUTH", role)));
    uint256[] memory flags = Uint256Component(_getCompAddr("component.id.type"))
      .getEntitiesWithValue(anchor);

    console.log("");
    console.log("%s (%d granted):", role, flags.length);
    for (uint256 i; i < flags.length; i++) {
      uint256 holder = _getUintComp("component.id.flag.owns").get(flags[i]);
      bool active = _getBoolComp("component.has.flag").has(flags[i]);
      console.log("  %s  %s", address(uint160(holder)), active ? "ACTIVE" : "revoked");
    }
    if (flags.length == 0) console.log("  (none)");
  }
}
