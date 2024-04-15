// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract AccountTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function setUpAccounts() public override {
    _createOwnerOperatorPairs(25);
  }

  function testOperator() public {
    address owner = _getOwner(0);
    address operator = _getOperator(0);
    Reverter reverter = new Reverter();

    // creating account
    vm.prank(owner);
    uint256 id = abi.decode(
      _AccountRegisterSystem.executeTyped(operator, "testAccount"),
      (uint256)
    );

    // assertions
    assertAddresses(id, owner, operator);
    address fake = address(0x1234);
    vm.expectRevert("Account: Operator not found");
    reverter.getByOperator(components, fake);

    // updating operator
    address prevOperator = operator;
    operator = _getOperator(1);
    vm.prank(owner);
    _AccountSetOperatorSystem.executeTyped(operator);

    // assertions
    assertAddresses(id, owner, operator);
    assertTrue(!_CacheOperatorComponent.has(uint256(uint160(prevOperator))));
    assertTrue(!LibAccount.operatorInUse(components, prevOperator));
    vm.expectRevert();
    _CacheOperatorComponent.get(uint256(uint160(prevOperator)));
    vm.expectRevert("Account: Operator not found");
    reverter.getByOperator(components, prevOperator);
  }

  function assertAddresses(uint256 id, address owner, address operator) public {
    assertEq(_AddressOwnerComponent.get(id), owner);
    assertEq(_AddressOperatorComponent.get(id), operator);
    assertEq(_CacheOperatorComponent.get(uint256(uint160(operator))), id);
    assertEq(LibAccount.getByOwner(components, owner), id);
    assertEq(LibAccount.getByOperator(components, operator), id);
    assertTrue(LibAccount.ownerInUse(components, owner));
    assertTrue(LibAccount.operatorInUse(components, operator));
  }
}

// needed to ensure reverts are not caught by the immidate next call, but overall call
contract Reverter {
  function getByOperator(IUint256Component components, address addr) public returns (uint256) {
    return LibAccount.getByOperator(components, addr);
  }
}
