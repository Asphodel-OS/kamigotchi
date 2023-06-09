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
    // token = new KamiERC20(world, "KAMI", "KAMI");

    // vm.startPrank(deployer);
    // _ERC20WithdrawSystem.init(address(token));
    // _ERC20DepositSystem.init(address(token));
    // vm.stopPrank();

    _registerAccount(alice, alice);
  }

  function testMint() public {
    vm.prank(deployer);
    __devGiveTokensSystem.executeTyped(alice, 101);

    vm.prank(alice);
    _ERC20WithdrawSystem.executeTyped(100);

    assertEq(token.balanceOf(alice), 100);

    assertEq(_CoinComponent.getValue(LibAccount.getByOperator(components, alice)), 1);
  }

  function testBurn() public {
    testMint();

    vm.prank(alice);
    _ERC20DepositSystem.executeTyped(50);

    assertEq(token.balanceOf(alice), 50);

    assertEq(_CoinComponent.getValue(LibAccount.getByOperator(components, alice)), 51);
  }
}
