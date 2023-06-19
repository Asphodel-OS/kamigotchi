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

    _registerAccount(0);
  }

  // TODO: randomize inputs
  function testMint() public {
    vm.prank(deployer);
    __devGiveTokensSystem.executeTyped(_getOperator(0), 101);

    vm.prank(_getOwner(0));
    _ERC20WithdrawSystem.executeTyped(100);

    assertEq(token.balanceOf(_getOwner(0)), 100);
    assertEq(_CoinComponent.getValue(_getAccount(0)), 1);
  }

  // TODO: randomize inputs
  function testBurn() public {
    vm.prank(deployer);
    __devGiveTokensSystem.executeTyped(_getOperator(0), 101);

    vm.startPrank(_getOwner(0));
    _ERC20WithdrawSystem.executeTyped(100);
    _ERC20DepositSystem.executeTyped(50);

    assertEq(token.balanceOf(_getOwner(0)), 50);
    assertEq(_CoinComponent.getValue(LibAccount.getByOperator(components, _getOperator(0))), 51);
  }
}
