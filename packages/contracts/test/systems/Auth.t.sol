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
