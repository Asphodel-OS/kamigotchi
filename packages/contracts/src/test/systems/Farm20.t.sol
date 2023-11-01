// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract Farm20Test is SetupTemplate {
  Farm20 token;
  uint256 constant MAX_INT = 2 ** 256 - 1;
  uint256 public minDelay;

  // converts ERC20 decimals (18) to game decimals (0)
  function _tokenToGameDP(uint256 amount) internal pure returns (uint256) {
    return amount / 10 ** 18;
  }

  // converts game decimals (0) to ERC20 decimals (18)
  function _gameToTokenDP(uint256 amount) internal pure returns (uint256) {
    return amount * 10 ** 18;
  }

  function _uncheckedAdd(uint256 a, uint256 b) internal pure returns (uint256) {
    unchecked {
      return a + b;
    }
  }

  function setUp() public override {
    super.setUp();
    token = _Farm20ProxySystem.getToken();

    _createRoom("testRoom1", 1, 4, 12, 0);
    _createRoom("testRoom4", 4, 1, 12, 0);
    _createRoom("testRoom4", 12, 1, 4, 0);

    _registerAccount(0);
    _registerAccount(1);

    minDelay = _Farm20WithdrawSystem.getMinDelay();
  }

  // tests that correct amounts are withdrawn
  // TODO: check that the tested account is the only one with a coin value
  function testWithdraw(uint256 startingBalance, uint256 amt, uint256 delay) public {
    vm.assume(startingBalance < _tokenToGameDP(MAX_INT));
    vm.assume(amt < _tokenToGameDP(MAX_INT));
    vm.assume(_uncheckedAdd(_currTime, delay) > _currTime);
    _fundAccount(0, startingBalance);
    _moveAccount(0, 12); // bridging restricted to room 12

    vm.startPrank(_getOwner(0));

    // withdraw the amt from the game
    if (amt == 0) {
      vm.expectRevert("Farm20Withdraw: amt must be > 0");
      _Farm20WithdrawSystem.scheduleWithdraw(amt);
    } else if (delay <= minDelay) {
      uint256 id = _Farm20WithdrawSystem.scheduleWithdraw(amt);
      _fastForward(delay);
      vm.expectRevert("operation not ready");
      _Farm20WithdrawSystem.executeWithdraw(id);
    } else {
      if (amt > startingBalance) {
        vm.expectRevert("Coin: insufficient balance");
        _Farm20WithdrawSystem.scheduleWithdraw(amt);
        return;
      }
      uint256 id = _Farm20WithdrawSystem.scheduleWithdraw(amt);
      // check operation struct
      (address target, uint256 value, uint256 salt) = LibTimelock.getTimelock(components, id);
      assertEq(target, _getOwner(0));
      assertEq(value, amt);
      assertEq(salt, block.timestamp);
      // roll
      _fastForward(delay);
      if (amt > startingBalance) {
        vm.expectRevert("Coin: insufficient balance");
        _Farm20WithdrawSystem.executeWithdraw(id);
      } else {
        _Farm20WithdrawSystem.executeWithdraw(id);

        // check the user has the correct balances in and out of the game
        uint256 internalBalance = _CoinComponent.getValue(_getAccount(0));
        assertEq(internalBalance, startingBalance - amt);

        uint256 externalBalance = token.balanceOf(_getOwner(0));
        assertEq(_tokenToGameDP(externalBalance), amt);

        // check that the total supply is the balance out of the world
        assertEq(_tokenToGameDP(token.totalSupply()), amt);
      }
    }

    vm.stopPrank();
  }

  // tests that correct amounts are deposited
  function testDeposit(uint256 startingBalance, uint256 amt) public {
    vm.assume(startingBalance > 0);
    vm.assume(startingBalance < _tokenToGameDP(MAX_INT));
    vm.assume(amt < _tokenToGameDP(MAX_INT));
    _fundAccount(0, startingBalance);
    _moveAccount(0, 12); // bridging restricted to room 12

    vm.startPrank(_getOwner(0));

    // pull out the full balance of funds
    uint256 id = _Farm20WithdrawSystem.scheduleWithdraw(startingBalance);
    _fastForward(minDelay + 1);
    _Farm20WithdrawSystem.executeWithdraw(id);

    // deposit the amt back into the game
    if (amt == 0) {
      vm.expectRevert("Farm20Deposit: amt must be > 0");
      _Farm20DepositSystem.executeTyped(amt);
    } else if (amt > startingBalance) {
      // vm.expectRevert("Arithmetic over/underflow"); // cannot get this matching, maybe insert our own error into the flow
      vm.expectRevert();
      _Farm20DepositSystem.executeTyped(amt);
    } else {
      _Farm20DepositSystem.executeTyped(amt);

      // check the user has the correct balances in and out of the game
      uint256 internalBalance = _CoinComponent.getValue(_getAccount(0));
      assertEq(internalBalance, amt);

      uint256 externalBalance = token.balanceOf(_getOwner(0));
      assertEq(_tokenToGameDP(externalBalance), startingBalance - amt);

      // check that the total supply is the balance expected out of the world
      assertEq(_tokenToGameDP(token.totalSupply()), startingBalance - amt);
    }

    vm.stopPrank();
  }

  // fund one account, have them withdraw, transfer the tokens to an address without an account.
  // when the address without and account attempt to deposit funds, this should fail.
  // TODO: implement this
  function testInvalidDeposit(uint256 amt) public {
    vm.assume(amt > 0);
    vm.assume(amt < _tokenToGameDP(MAX_INT));
    _fundAccount(0, amt);
    _moveAccount(0, 12); // bridging restricted to room 12

    // withdraw full amount
    vm.prank(_getOwner(0));
    uint256 id = _Farm20WithdrawSystem.scheduleWithdraw(amt);
    _fastForward(minDelay + 1);
    vm.prank(_getOwner(0));
    _Farm20WithdrawSystem.executeWithdraw(id);

    // transfer to an address without an account
    vm.prank(_getOwner(0));
    token.transfer(_getOwner(2), _gameToTokenDP(amt));

    // attempt to deposit funds
    vm.prank(_getOwner(2));
    vm.expectRevert("Farm20Deposit: no account detected");
    _Farm20DepositSystem.executeTyped(amt);
  }

  // run multiple deposits and withdrawals interwoven between multiple accounts
  // test that all balances are as expected at the end
  function testMultiple(
    uint256 startBal0,
    uint256 startBal1,
    uint256 amt0,
    uint256 amt1,
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

    // bridging restricted to room 12
    _moveAccount(0, 12);
    _moveAccount(1, 12);

    // withdraw from account 0
    vm.startPrank(_getOwner(0));
    if (amt0 == 0) {
      vm.expectRevert("Farm20Withdraw: amt must be > 0");
      uint256 id = _Farm20WithdrawSystem.scheduleWithdraw(amt0);

      return;
    } else if (amt0 > startBal0) {
      vm.expectRevert("Coin: insufficient balance");
      uint256 id = _Farm20WithdrawSystem.scheduleWithdraw(amt0);

      return;
    } else {
      uint256 id = _Farm20WithdrawSystem.scheduleWithdraw(amt0);
      _fastForward(minDelay + 1);
      _Farm20WithdrawSystem.executeWithdraw(id);

      // check the user has the correct balances in and out of the game
      uint256 internalBalance = _CoinComponent.getValue(_getAccount(0));
      assertEq(internalBalance, startBal0 - amt0);

      uint256 externalBalance = token.balanceOf(_getOwner(0));
      assertEq(_tokenToGameDP(externalBalance), amt0);

      uint256 internalBalance1 = _CoinComponent.getValue(_getAccount(1));
      assertEq(internalBalance1, startBal1);

      uint256 externalBalance1 = token.balanceOf(_getOwner(1));
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
      uint256 id = _Farm20WithdrawSystem.scheduleWithdraw(amt1);
    } else if (amt1 > startBal1) {
      vm.expectRevert("Coin: insufficient balance");
      uint256 id = _Farm20WithdrawSystem.scheduleWithdraw(amt1);
    } else {
      uint256 id = _Farm20WithdrawSystem.scheduleWithdraw(amt1);
      _fastForward(minDelay + 1);
      _Farm20WithdrawSystem.executeWithdraw(id);

      // check the user has the correct balances in and out of the game
      if (withDeposit) {
        uint256 internalBalance = _CoinComponent.getValue(_getAccount(0));
        assertEq(internalBalance, startBal0);

        uint256 externalBalance = token.balanceOf(_getOwner(0));
        assertEq(_tokenToGameDP(externalBalance), 0);

        // check that the total supply is the balance out of the world
        assertEq(_tokenToGameDP(token.totalSupply()), amt1);
      } else {
        uint256 internalBalance = _CoinComponent.getValue(_getAccount(0));
        assertEq(internalBalance, startBal0 - amt0);

        uint256 externalBalance = token.balanceOf(_getOwner(0));
        assertEq(_tokenToGameDP(externalBalance), amt0);

        // check that the total supply is the balance out of the world
        assertEq(_tokenToGameDP(token.totalSupply()), amt0 + amt1);
      }

      uint256 internalBalance1 = _CoinComponent.getValue(_getAccount(1));
      assertEq(internalBalance1, startBal1 - amt1);

      uint256 externalBalance1 = token.balanceOf(_getOwner(1));
      assertEq(_tokenToGameDP(externalBalance1), amt1);
    }
  }

  // test that proper balances are reflected after transfering from one address to another
  function testTransfer(uint256 startBal0, uint256 startBal1, uint256 amt) public {
    vm.assume(startBal0 > 0);
    vm.assume(startBal1 > 0);
    vm.assume(startBal0 < _tokenToGameDP(MAX_INT));
    vm.assume(startBal1 < _tokenToGameDP(MAX_INT));
    vm.assume(amt < _tokenToGameDP(MAX_INT));
    vm.assume(_uncheckedAdd(startBal0 * 10 ** 18, startBal1 * 10 ** 18) > startBal1 * 10 ** 18);
    _fundAccount(0, startBal0);
    _fundAccount(1, startBal1);

    // bridging restricted to room 12
    _moveAccount(0, 12);
    _moveAccount(1, 12);

    vm.prank(_getOwner(0));
    uint256 id = _Farm20WithdrawSystem.scheduleWithdraw(startBal0);
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
    uint256 delay,
    bool cancelled,
    bool blacklistedBefore,
    bool blacklistedAfter
  ) public {
    vm.assume(_uncheckedAdd(_currTime, delay) >= _currTime);

    uint256 amt = 100;
    _fundAccount(0, amt);

    // bridging restricted to room 12
    _moveAccount(0, 12);

    uint256 id;
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
    // bridging restricted to room 12
    _moveAccount(0, 12);
    _moveAccount(1, 12);

    assertTrue(_Farm20WithdrawSystem.isAdmin(deployer));
    assertTrue(!_Farm20WithdrawSystem.isAdmin(_getOwner(0)));

    vm.prank(_getOwner(1));
    uint256 id = _Farm20WithdrawSystem.scheduleWithdraw(100);

    vm.prank(_getOwner(0));
    vm.expectRevert("not authorized");
    _Farm20WithdrawSystem.cancelWithdraw(id);

    vm.prank(_getOwner(0));
    vm.expectRevert();
    _Farm20WithdrawSystem.updateMinDelay(0);

    vm.prank(_getOwner(0));
    vm.expectRevert();
    _Farm20WithdrawSystem.blacklist(address(0));

    vm.prank(_getOwner(0));
    vm.expectRevert();
    _Farm20WithdrawSystem.unblacklist(address(0));

    vm.prank(_getOwner(0));
    vm.expectRevert();
    _Farm20WithdrawSystem.updateAdmin(address(0), true);

    vm.prank(deployer);
    _Farm20WithdrawSystem.updateAdmin(_getOwner(0), true);
    assertTrue(_Farm20WithdrawSystem.isAdmin(_getOwner(0)));

    vm.startPrank(_getOwner(0));
    _Farm20WithdrawSystem.blacklist(address(0));
    _Farm20WithdrawSystem.unblacklist(address(0));
    vm.expectRevert();
    _Farm20WithdrawSystem.updateAdmin(address(0), true);
    vm.expectRevert();
    _Farm20WithdrawSystem.updateMinDelay(0);
    vm.stopPrank();

    // bridging restricted to room 12
    _moveAccount(0, 12);
    _moveAccount(1, 12);

    vm.prank(_getOwner(1));
    _Farm20WithdrawSystem.cancelWithdraw(id);

    vm.prank(_getOwner(1));
    id = _Farm20WithdrawSystem.scheduleWithdraw(id);
    vm.prank(_getOwner(0));
    _Farm20WithdrawSystem.cancelWithdraw(id);
  }
}
