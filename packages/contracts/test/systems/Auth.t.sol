// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";

contract AuthTest is SetupTemplate {
  function testRoles() public {
    address CommManager = address(0x1);
    address Admin = address(0x2);
    address Intruder = address(0x3);
    Wrapper wrapper = new Wrapper();

    setRole(CommManager, "ROLE_COMMUNITY_MANAGER", true);
    setRole(Admin, "ROLE_ADMIN", true);
    setRole(Admin, "ROLE_COMMUNITY_MANAGER", true);

    // check shape
    assertFalse(hasRole(CommManager, "ROLE_ADMIN"));
    assertTrue(hasRole(CommManager, "ROLE_COMMUNITY_MANAGER"));
    assertTrue(hasRole(Admin, "ROLE_ADMIN"));
    assertTrue(hasRole(Admin, "ROLE_COMMUNITY_MANAGER"));
    assertFalse(hasRole(Intruder, "ROLE_ADMIN"));
    assertFalse(hasRole(Intruder, "ROLE_COMMUNITY_MANAGER"));

    // check access (community manager)
    vm.prank(CommManager);
    wrapper.mustCommManager(components);
    vm.prank(CommManager);
    vm.expectRevert("Auth: not an admin");
    wrapper.mustAdmin(components);

    // check access (admin)
    vm.prank(Admin);
    wrapper.mustAdmin(components);
    vm.prank(Admin);
    wrapper.mustCommManager(components);

    // check access (intruder)
    vm.prank(Intruder);
    vm.expectRevert("Auth: not a community manager");
    wrapper.mustCommManager(components);
    vm.prank(Intruder);
    vm.expectRevert("Auth: not an admin");
    wrapper.mustAdmin(components);

    // removing role from admin
    setRole(Admin, "ROLE_ADMIN", false);
    assertFalse(hasRole(Admin, "ROLE_ADMIN"));
    vm.prank(Admin);
    vm.expectRevert("Auth: not an admin");
    wrapper.mustAdmin(components);
  }

  // an admin must not be able to escalate to ROLE_ADMIN via the generic flag
  // setter (which would bypass the owner-gated auth registry and the Safe)
  function testAdminSetFlagCannotGrantRoles() public {
    address Admin = address(0x2);
    setRole(Admin, "ROLE_ADMIN", true);

    uint256[] memory targets = new uint256[](1);
    targets[0] = _getAccount(0); // alice's account (id == uint160(owner))

    // role flags are rejected regardless of target
    vm.prank(Admin);
    vm.expectRevert("roles: use auth registry");
    __AdminSetFlagSystem.executeTyped(targets, "ROLE_ADMIN", true);

    vm.prank(Admin);
    vm.expectRevert("roles: use auth registry");
    __AdminSetFlagSystem.executeTyped(targets, "ROLE_COMMUNITY_MANAGER", true);

    // non-role flags still work (giveaways, airdrops)
    vm.prank(Admin);
    __AdminSetFlagSystem.executeTyped(targets, "AIRDROP_2026", true);
    assertTrue(LibFlag.has(components, targets[0], "AIRDROP_2026"));
  }

  ///////////////
  // UTILS

  function setRole(address addr, string memory role, bool status) internal {
    vm.prank(deployer);
    if (status) __AuthManageRoleSystem.addRole(addr, role);
    else __AuthManageRoleSystem.removeRole(addr, role);
  }

  function hasRole(address addr, string memory role) internal view returns (bool) {
    return LibFlag.has(components, uint256(uint160(addr)), role);
  }
}

contract Wrapper is AuthRoles {
  function mustCommManager(IUint256Component components) public onlyCommManager(components) {}

  function mustAdmin(IUint256Component components) public onlyAdmin(components) {}
}
