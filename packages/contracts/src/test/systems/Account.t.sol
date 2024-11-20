// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "tests/utils/SetupTemplate.t.sol";

// this test experience gain, leveling and all expected effects due to leveling
contract AccountTest is SetupTemplate {
  Reverter reverter;

  function setUp() public override {
    super.setUp();

    reverter = new Reverter();
    vm.startPrank(deployer);
    _StaminaComponent.authorizeWriter(address(reverter));
    _TimeLastActionComponent.authorizeWriter(address(reverter));
    vm.stopPrank();

    // [base stamina, base recovery period per point, base movement cost (in stamina), base experience per move]
    _setConfig("ACCOUNT_STAMINA", [uint32(20), 300, 1, 0, 0, 0, 0, 0]);
  }

  function setUpAccounts() public override {
    _createOwnerOperatorPairs(25);
  }

  function testOperator() public {
    address owner = _getOwner(0);
    address operator = _getOperator(0);

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

  // function testStaminaUse(uint32 amt, uint16 rawBase, uint16 start, uint32 timeDelta) public {
  //   uint256 base = uint256(rawBase);
  //   // check overflows
  //   // vm.assume(amt > 2147483648);
  //   int32 overflowCheck;
  //   uint256 recoveryPeriod = uint256(LibConfig.getArray(components, "ACCOUNT_STAMINA")[1]);
  //   unchecked {
  //     overflowCheck = amt + uint32(uint256(timeDelta) / recoveryPeriod);
  //   }
  //   vm.assume(overflowCheck > amt);
  //   unchecked {
  //     overflowCheck = amt + =int(base);

  //   vm.assume(overflowCheck > amt);

  //   // setup
  //   vm.startPrank(deployer);
  //   Stat memory baseStat = Stat(int(base), 0, 0, int(uint256(start)));
  //   LibStat.setStamina(components, alice.id, baseStat);
  //   LibStat.setStamina(components, bob.id, baseStat);
  //   LibAccount.setLastActionTs(components, alice.id, block.timestamp);
  //   LibAccount.setLastActionTs(components, bob.id, block.timestamp);
  //   vm.stopPrank();

  //   // sync control (bob)
  //   _fastForward(timeDelta);
  //   vm.startPrank(deployer);
  //   int32 expected = LibAccount.sync(components, bob.id); // expected synced value
  //   vm.stopPrank();

  //   // alice syncs
  //   vm.startPrank(deployer);
  //   if (amt * -1 > expected) vm.expectRevert("Account: insufficient stamina");
  //   reverter.syncAndUseStamina(components, alice.id, amt);
  //   vm.stopPrank();
  // }

  ////////////////
  // ASSERTIONS

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

  function syncAndUseStamina(IUint256Component components, uint256 id, uint32 amt) public {
    LibAccount.sync(components, id);
    LibAccount.depleteStamina(components, id, amt);
  }
}
