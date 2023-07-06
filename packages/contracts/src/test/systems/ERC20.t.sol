// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

// manually imports and deploys erc20.
// TODO: integrate it with deployment script
import { KamiERC20 } from "tokens/KamiERC20.sol";

contract ERC20Test is SetupTemplate {
  KamiERC20 token;
  uint256 constant MAX_INT = 2 ** 256 - 1;

  // converts ERC20 decimals (18) to game decimals (0)
  function _tokenToGameDP(uint256 amount) internal view returns (uint256) {
    return amount / 10 ** 18;
  }

  // converts game decimals (0) to ERC20 decimals (18)
  function _gameToTokenDP(uint256 amount) internal view returns (uint256) {
    return amount * 10 ** 18;
  }

  function uncheckedAdd(uint256 a, uint256 b) internal returns (uint256) {
    unchecked {
      return a + b;
    }
  }

  function setUp() public override {
    super.setUp();
    token = _ERC20ProxySystem.getToken();

    _registerAccount(0);
    _registerAccount(1);
  }

  // tests that correct amounts are withdrawn
  // TODO: check that the tested account is the only one with a coin value
  function testWithdraw(uint256 startingBalance, uint256 amt) public {
    vm.assume(startingBalance < _tokenToGameDP(MAX_INT));
    vm.assume(amt < _tokenToGameDP(MAX_INT));
    _fundAccount(0, startingBalance);
    vm.startPrank(_getOwner(0));

    // withdraw the amt from the game
    if (amt == 0) {
      vm.expectRevert("ERC20Withdraw: amt must be > 0");
      _ERC20WithdrawSystem.executeTyped(amt);
    } else if (amt > startingBalance) {
      vm.expectRevert("Coin: insufficient balance");
      _ERC20WithdrawSystem.executeTyped(amt);
    } else {
      _ERC20WithdrawSystem.executeTyped(amt);

      // check the user has the correct balances in and out of the game
      uint256 internalBalance = _CoinComponent.getValue(_getAccount(0));
      assertEq(internalBalance, startingBalance - amt);

      uint256 externalBalance = token.balanceOf(_getOwner(0));
      assertEq(_tokenToGameDP(externalBalance), amt);

      // check that the total supply is the balance out of the world
      assertEq(_tokenToGameDP(token.totalSupply()), amt);
    }

    vm.stopPrank();
  }

  // tests that correct amounts are deposited
  function testDeposit(uint256 startingBalance, uint256 amt) public {
    vm.assume(startingBalance > 0);
    vm.assume(startingBalance < _tokenToGameDP(MAX_INT));
    vm.assume(amt < _tokenToGameDP(MAX_INT));
    _fundAccount(0, startingBalance);
    vm.startPrank(_getOwner(0));

    // pull out the full balance of funds
    _ERC20WithdrawSystem.executeTyped(startingBalance);

    // deposit the amt back into the game
    if (amt == 0) {
      vm.expectRevert("ERC20Deposit: amt must be > 0");
      _ERC20DepositSystem.executeTyped(amt);
    } else if (amt > startingBalance) {
      // vm.expectRevert("Arithmetic over/underflow"); // cannot get this matching, maybe insert our own error into the flow
      vm.expectRevert();
      _ERC20DepositSystem.executeTyped(amt);
    } else {
      _ERC20DepositSystem.executeTyped(amt);

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

    // withdraw full amount
    vm.prank(_getOwner(0));
    _ERC20WithdrawSystem.executeTyped(amt);

    // transfer to an address without an account
    vm.prank(_getOwner(0));
    token.transfer(_getOwner(2), _gameToTokenDP(amt));

    // attempt to deposit funds
    vm.prank(_getOwner(2));
    vm.expectRevert("ERC20Deposit: addy has no acc");
    _ERC20DepositSystem.executeTyped(amt);
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
    vm.assume(uncheckedAdd(startBal0 * 10 ** 18, startBal1 * 10 ** 18) > startBal1 * 10 ** 18);
    _fundAccount(0, startBal0);
    _fundAccount(1, startBal1);

    // withdraw from account 0
    vm.startPrank(_getOwner(0));
    if (amt0 == 0) {
      vm.expectRevert("ERC20Withdraw: amt must be > 0");
      _ERC20WithdrawSystem.executeTyped(amt0);

      return;
    } else if (amt0 > startBal0) {
      vm.expectRevert("Coin: insufficient balance");
      _ERC20WithdrawSystem.executeTyped(amt0);

      return;
    } else {
      _ERC20WithdrawSystem.executeTyped(amt0);

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
      _ERC20DepositSystem.executeTyped(amt0);
    }

    vm.stopPrank();

    // withdraw from account 1
    vm.startPrank(_getOwner(1));
    if (amt1 == 0) {
      vm.expectRevert("ERC20Withdraw: amt must be > 0");
      _ERC20WithdrawSystem.executeTyped(amt1);
    } else if (amt1 > startBal1) {
      vm.expectRevert("Coin: insufficient balance");
      _ERC20WithdrawSystem.executeTyped(amt1);
    } else {
      _ERC20WithdrawSystem.executeTyped(amt1);

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
    vm.assume(uncheckedAdd(startBal0 * 10 ** 18, startBal1 * 10 ** 18) > startBal1 * 10 ** 18);
    _fundAccount(0, startBal0);
    _fundAccount(1, startBal1);

    vm.prank(_getOwner(0));
    _ERC20WithdrawSystem.executeTyped(startBal0);
    vm.prank(_getOwner(1));
    _ERC20WithdrawSystem.executeTyped(startBal1);

    // transfer amount from account 0 to 1
    if (amt > startBal0) {
      vm.prank(_getOwner(0));
      vm.expectRevert();
      token.transfer(_getOwner(1), _gameToTokenDP(amt));

      assertEq(_tokenToGameDP(token.balanceOf(_getOwner(0))), startBal0);
      assertEq(_tokenToGameDP(token.balanceOf(_getOwner(1))), startBal1);
    } else if (uncheckedAdd(startBal1, amt) <= amt) {
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
}
