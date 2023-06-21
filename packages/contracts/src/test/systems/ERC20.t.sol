// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

// manually imports and deploys erc20.
// TODO: integrate it with deployment script
import { KamiERC20 } from "tokens/KamiERC20.sol";

contract ERC20Test is SetupTemplate {
  KamiERC20 token;

  function setUp() public override {
    super.setUp();
    token = _ERC20ProxySystem.getToken();
    _registerAccount(0);
    _registerAccount(1);
  }

  // tests that correct amounts are withdrawn
  // TODO: check that the tested account is the only one with a coin value
  function testWithdraw(uint256 startingBalance, uint256 amt) public {
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
      assertEq(externalBalance, amt);

      // check that the total supply is the balance out of the world
      assertEq(token.totalSupply(), amt);
    }

    vm.stopPrank();
  }

  // tests that correct amounts are deposited
  function testDeposit(uint256 startingBalance, uint256 amt) public {
    vm.assume(startingBalance > 0);
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
      assertEq(externalBalance, startingBalance - amt);

      // check that the total supply is the balance expected out of the world
      assertEq(token.totalSupply(), startingBalance - amt);
    }

    vm.stopPrank();
  }

  // fund one account, have them withdraw, transfer the tokens to an address without an account.
  // when the address without and account attempt to deposit funds, this should fail.
  // TODO: implement this
  function testInvalidDeposit() public {}

  // run multiple deposits and withdrawals interwoven between multiple accounts
  // test that all balances are as expected at the end
  // TODO: implement this
  function testMultiple() public {}

  // test that proper balances are reflected after transfering from one address to another
  // TODO: implement this
  function testTransfer() public {}
}
