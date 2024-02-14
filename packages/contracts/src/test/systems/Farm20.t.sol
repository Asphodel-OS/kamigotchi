// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract Farm20Test is SetupTemplate {
  Farm20 token;
  uint constant MAX_INT = 2 ** 256 - 1;
  uint public minDelay;

  function setUp() public override {
    super.setUp();
    token = _Farm20ProxySystem.getToken();

    _moveAccount(0, 12); // bridging restricted to room 12
    _moveAccount(1, 12); // bridging restricted to room 12

    minDelay = _Farm20WithdrawSystem.getMinDelay();
  }

  function setUpAccounts() public override {
    _createOwnerOperatorPairs(25); // create 10 pairs of Owners/Operators
    _registerAccounts(10);
  }

  function setUpRooms() public override {
    _createRoom("testRoom1", 1, 4, 12, 0);
    _createRoom("testRoom4", 4, 1, 12, 0);
    _createRoom("testRoom12", 12, 1, 4, 0);
  }

  /////////////////
  // HELPER FUNCS

  // converts ERC20 decimals (18) to game decimals (0)
  function _tokenToGameDP(uint amount) internal pure returns (uint) {
    return amount / 10 ** 18;
  }

  // converts game decimals (0) to ERC20 decimals (18)
  function _gameToTokenDP(uint amount) internal pure returns (uint) {
    return amount * 10 ** 18;
  }

  function _uncheckedAdd(uint a, uint b) internal pure returns (uint) {
    unchecked {
      return a + b;
    }
  }

  // tests that correct amounts are withdrawn
  // TODO: test multiple layered withdraws scheduled
  // TODO: check that the tested account is the only one with a coin value
  function testWithdrawSingle(uint startBal, uint amt, uint delay) public {
    vm.assume(startBal < _tokenToGameDP(MAX_INT)); // starting balance is lower than max int
    vm.assume(amt < _tokenToGameDP(MAX_INT)); // withdraw amount is lower than max int
    vm.assume(_uncheckedAdd(_currTime, delay) > _currTime); // prevent time wrap-arounds
    _fundAccount(0, startBal);

    vm.startPrank(_getOwner(0));

    // check constraints on scheduling a withdraw
    if (amt == 0) {
      vm.expectRevert("Farm20Withdraw: amt must be > 0");
      _Farm20WithdrawSystem.scheduleWithdraw(amt);
      return;
    }
    if (amt > startBal) {
      vm.expectRevert("Coin: insufficient balance");
      _Farm20WithdrawSystem.scheduleWithdraw(amt);
      return;
    }

    // schedule a withdraw, deconstruct timelock operation and fastforward by the delay
    uint withdrawID = _Farm20WithdrawSystem.scheduleWithdraw(amt);
    (address target, uint value, uint salt) = LibTimelock.getTimelock(components, withdrawID);
    assertEq(target, _getOwner(0));
    assertEq(value, amt);
    assertEq(salt, block.timestamp);
    _fastForward(delay);

    // check constraints on executing a withdraw
    if (delay <= minDelay) {
      vm.expectRevert("operation not ready");
      _Farm20WithdrawSystem.executeWithdraw(withdrawID);
      return;
    }

    // execute withdraw and confirm correct internal/external/total balances
    _Farm20WithdrawSystem.executeWithdraw(withdrawID);
    uint internalBalance = _CoinComponent.getValue(_getAccount(0));
    uint externalBalance = token.balanceOf(_getOwner(0));
    assertEq(internalBalance, startBal - amt);
    assertEq(_tokenToGameDP(externalBalance), amt);
    assertEq(_tokenToGameDP(token.totalSupply()), amt); // total contract supply

    vm.stopPrank();
  }

  // tests that correct amounts are deposited
  function testDeposit(uint startBal, uint amt) public {
    vm.assume(startBal < _tokenToGameDP(MAX_INT)); // starting balance is lower than max int
    vm.assume(amt < _tokenToGameDP(MAX_INT)); // deposit amount is lower than max int
    _fundAccount(0, startBal);

    vm.startPrank(_getOwner(0));

    // pull out the full balance of funds
    if (startBal > 0) {
      uint withdrawID = _Farm20WithdrawSystem.scheduleWithdraw(startBal);
      _fastForward(minDelay + 1);
      _Farm20WithdrawSystem.executeWithdraw(withdrawID);
    }

    // check deposit constraints
    if (amt == 0) {
      vm.expectRevert("Farm20Deposit: amt must be > 0");
      _Farm20DepositSystem.executeTyped(amt);
      return;
    }
    if (amt > startBal) {
      // cannot get this matching, maybe insert our own error into the flow
      // vm.expectRevert("Arithmetic over/underflow");
      vm.expectRevert();
      _Farm20DepositSystem.executeTyped(amt);
      return;
    }

    // check the user has the correct balances in and out of the game
    _Farm20DepositSystem.executeTyped(amt);
    uint internalBalance = _CoinComponent.getValue(_getAccount(0));
    uint externalBalance = token.balanceOf(_getOwner(0));
    assertEq(internalBalance, amt);
    assertEq(_tokenToGameDP(externalBalance), startBal - amt);
    assertEq(_tokenToGameDP(token.totalSupply()), startBal - amt); // total contract supply

    vm.stopPrank();
  }

  // fund one account, have them withdraw, transfer the tokens to an address without an account.
  // when the address without and account attempt to deposit funds, this should fail.
  // TODO: implement this
  function testInvalidDeposit(uint amt) public {
    vm.assume(amt > 0);
    vm.assume(amt < _tokenToGameDP(MAX_INT));
    _fundAccount(0, amt);

    // withdraw full amount
    vm.prank(_getOwner(0));
    uint id = _Farm20WithdrawSystem.scheduleWithdraw(amt);
    _fastForward(minDelay + 1);
    vm.prank(_getOwner(0));
    _Farm20WithdrawSystem.executeWithdraw(id);

    // transfer to an address without an account
    vm.prank(_getOwner(0));
    token.transfer(_getOwner(11), _gameToTokenDP(amt));

    // attempt to deposit funds
    vm.prank(_getOwner(11));
    vm.expectRevert("Farm20Deposit: no account detected");
    _Farm20DepositSystem.executeTyped(amt);
  }

  // run multiple deposits and withdrawals interwoven between multiple accounts
  // test that all balances are as expected at the end
  function testMultiple(
    uint startBal0,
    uint startBal1,
    uint amt0,
    uint amt1,
    bool withDeposit
  ) public {
    vm.assume(startBal0 > 0);
    vm.assume(startBal1 > 0);
    vm.assume(startBal0 < _tokenToGameDP(MAX_INT));
    vm.assume(startBal1 < _tokenToGameDP(MAX_INT));
    vm.assume(amt0 < _tokenToGameDP(MAX_INT));
    vm.assume(amt1 < _tokenToGameDP(MAX_INT));
    vm.assume(_uncheckedAdd(startBal0 * 10 ** 18, startBal1 * 10 ** 18) > startBal1 * 10 ** 18);
    _fundAccount(0, startBal0);
    _fundAccount(1, startBal1);

    // withdraw from account 0
    vm.startPrank(_getOwner(0));
    if (amt0 == 0) {
      vm.expectRevert("Farm20Withdraw: amt must be > 0");
      uint id = _Farm20WithdrawSystem.scheduleWithdraw(amt0);

      return;
    } else if (amt0 > startBal0) {
      vm.expectRevert("Coin: insufficient balance");
      uint id = _Farm20WithdrawSystem.scheduleWithdraw(amt0);

      return;
    } else {
      uint id = _Farm20WithdrawSystem.scheduleWithdraw(amt0);
      _fastForward(minDelay + 1);
      _Farm20WithdrawSystem.executeWithdraw(id);

      // check the user has the correct balances in and out of the game
      uint internalBalance = _CoinComponent.getValue(_getAccount(0));
      assertEq(internalBalance, startBal0 - amt0);

      uint externalBalance = token.balanceOf(_getOwner(0));
      assertEq(_tokenToGameDP(externalBalance), amt0);

      uint internalBalance1 = _CoinComponent.getValue(_getAccount(1));
      assertEq(internalBalance1, startBal1);

      uint externalBalance1 = token.balanceOf(_getOwner(1));
      assertEq(_tokenToGameDP(externalBalance1), 0);

      // check that the total supply is the balance out of the world
      assertEq(_tokenToGameDP(token.totalSupply()), amt0);
    }

    // deposit back to account 0 if fuzz
    if (withDeposit) {
      _Farm20DepositSystem.executeTyped(amt0);
    }

    vm.stopPrank();

    // withdraw from account 1
    vm.startPrank(_getOwner(1));
    if (amt1 == 0) {
      vm.expectRevert("Farm20Withdraw: amt must be > 0");
      uint id = _Farm20WithdrawSystem.scheduleWithdraw(amt1);
    } else if (amt1 > startBal1) {
      vm.expectRevert("Coin: insufficient balance");
      uint id = _Farm20WithdrawSystem.scheduleWithdraw(amt1);
    } else {
      uint id = _Farm20WithdrawSystem.scheduleWithdraw(amt1);
      _fastForward(minDelay + 1);
      _Farm20WithdrawSystem.executeWithdraw(id);

      // check the user has the correct balances in and out of the game
      if (withDeposit) {
        uint internalBalance = _CoinComponent.getValue(_getAccount(0));
        assertEq(internalBalance, startBal0);

        uint externalBalance = token.balanceOf(_getOwner(0));
        assertEq(_tokenToGameDP(externalBalance), 0);

        // check that the total supply is the balance out of the world
        assertEq(_tokenToGameDP(token.totalSupply()), amt1);
      } else {
        uint internalBalance = _CoinComponent.getValue(_getAccount(0));
        assertEq(internalBalance, startBal0 - amt0);

        uint externalBalance = token.balanceOf(_getOwner(0));
        assertEq(_tokenToGameDP(externalBalance), amt0);

        // check that the total supply is the balance out of the world
        assertEq(_tokenToGameDP(token.totalSupply()), amt0 + amt1);
      }

      uint internalBalance1 = _CoinComponent.getValue(_getAccount(1));
      assertEq(internalBalance1, startBal1 - amt1);

      uint externalBalance1 = token.balanceOf(_getOwner(1));
      assertEq(_tokenToGameDP(externalBalance1), amt1);
    }
  }

  // test that proper balances are reflected after transfering from one address to another
  function testTransfer(uint startBal0, uint startBal1, uint amt) public {
    vm.assume(startBal0 > 0);
    vm.assume(startBal1 > 0);
    vm.assume(startBal0 < _tokenToGameDP(MAX_INT));
    vm.assume(startBal1 < _tokenToGameDP(MAX_INT));
    vm.assume(amt < _tokenToGameDP(MAX_INT));
    vm.assume(_uncheckedAdd(startBal0 * 10 ** 18, startBal1 * 10 ** 18) > startBal1 * 10 ** 18);
    _fundAccount(0, startBal0);
    _fundAccount(1, startBal1);

    vm.prank(_getOwner(0));
    uint id = _Farm20WithdrawSystem.scheduleWithdraw(startBal0);
    _fastForward(minDelay + 1);
    vm.prank(_getOwner(0));
    _Farm20WithdrawSystem.executeWithdraw(id);
    vm.prank(_getOwner(1));
    id = _Farm20WithdrawSystem.scheduleWithdraw(startBal1);
    _fastForward(minDelay + 1);
    vm.prank(_getOwner(1));
    _Farm20WithdrawSystem.executeWithdraw(id);

    // transfer amount from account 0 to 1
    if (amt > startBal0) {
      vm.prank(_getOwner(0));
      vm.expectRevert();
      token.transfer(_getOwner(1), _gameToTokenDP(amt));

      assertEq(_tokenToGameDP(token.balanceOf(_getOwner(0))), startBal0);
      assertEq(_tokenToGameDP(token.balanceOf(_getOwner(1))), startBal1);
    } else if (_uncheckedAdd(startBal1, amt) <= amt) {
      vm.prank(_getOwner(0));
      vm.expectRevert();
      token.transfer(_getOwner(1), _gameToTokenDP(amt));

      assertEq(_tokenToGameDP(token.balanceOf(_getOwner(0))), startBal0);
      assertEq(_tokenToGameDP(token.balanceOf(_getOwner(1))), startBal1);
    } else {
      vm.prank(_getOwner(0));
      token.transfer(_getOwner(1), _gameToTokenDP(amt));

      assertEq(_tokenToGameDP(token.balanceOf(_getOwner(0))), startBal0 - amt);
      assertEq(_tokenToGameDP(token.balanceOf(_getOwner(1))), startBal1 + amt);
    }
  }

  function testTimelock(
    uint delay,
    bool cancelled,
    bool blacklistedBefore,
    bool blacklistedAfter
  ) public {
    vm.assume(_uncheckedAdd(_currTime, delay) >= _currTime);

    uint amt = 100;
    _fundAccount(0, amt);

    uint id;
    if (blacklistedBefore) {
      vm.prank(deployer);
      _Farm20WithdrawSystem.blacklist(_getOwner(0));

      vm.prank(_getOwner(0));
      vm.expectRevert("address blacklisted");
      id = _Farm20WithdrawSystem.scheduleWithdraw(amt);

      return;
    }

    vm.warp(_currTime);
    vm.prank(_getOwner(0));
    id = _Farm20WithdrawSystem.scheduleWithdraw(amt);
    _fastForward(delay);
    if (delay < minDelay) {
      vm.expectRevert("operation not ready");
      _Farm20WithdrawSystem.executeWithdraw(id);
    } else {
      if (blacklistedAfter) {
        vm.prank(deployer);
        _Farm20WithdrawSystem.blacklist(_getOwner(0));
        vm.expectRevert("address blacklisted");
      } else if (cancelled) {
        vm.prank(deployer);
        _Farm20WithdrawSystem.cancelWithdraw(id);
        vm.expectRevert();
      }
      _Farm20WithdrawSystem.executeWithdraw(id);
    }
  }

  function testBridgeRoles() public {
    assertTrue(_Farm20WithdrawSystem.isAdmin(deployer));

    // ensure random players cannot update bridge parameters
    for (uint i; i < _owners.length - 1; i++) {
      assertTrue(!_Farm20WithdrawSystem.isAdmin(_getOwner(i)));

      vm.startPrank(_getOwner(i));
      vm.expectRevert();
      _Farm20WithdrawSystem.updateMinDelay(0);
      vm.expectRevert();
      _Farm20WithdrawSystem.blacklist(address(0));
      vm.expectRevert();
      _Farm20WithdrawSystem.unblacklist(address(0));
      vm.expectRevert();
      _Farm20WithdrawSystem.updateAdmin(address(0), true);
      vm.stopPrank();
    }

    // schedule a withdraw with our test account
    uint amt = 100;
    _fundAccount(0, amt);
    vm.prank(_getOwner(0));
    uint id = _Farm20WithdrawSystem.scheduleWithdraw(amt);

    // ensure random players cannot cancel their withdraw
    for (uint i = 1; i < _owners.length - 1; i++) {
      vm.prank(_getOwner(i));
      vm.expectRevert("not authorized");
      _Farm20WithdrawSystem.cancelWithdraw(id);
    }

    // promote player 1 to admin
    vm.prank(deployer);
    _Farm20WithdrawSystem.updateAdmin(_getOwner(1), true);
    assertTrue(_Farm20WithdrawSystem.isAdmin(_getOwner(1)));

    // check that player 1 has admin permissions now
    vm.startPrank(_getOwner(1));
    _Farm20WithdrawSystem.blacklist(address(0));
    _Farm20WithdrawSystem.unblacklist(address(0));
    _Farm20WithdrawSystem.cancelWithdraw(id);

    // check that player 1 does not have owner permissions
    vm.expectRevert();
    _Farm20WithdrawSystem.updateAdmin(address(0), true);
    vm.expectRevert();
    _Farm20WithdrawSystem.updateMinDelay(0);

    vm.stopPrank();
  }
}
