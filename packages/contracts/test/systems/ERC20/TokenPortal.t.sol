// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

import { RESERVE_ACC } from "libraries/LibTokenPortal.sol";

/// @notice basic system testing for systems that are not directly tested elsewhere
/** @dev
 * does not check for any state – just to see if the systems are working
 * uses the default setup template setup (uses template functions when possible)
 * this is to check for the basic world state and ensure no operational errors
 */
contract TokenPortalTest is SetupTemplate {
  uint32 private tokenItem = 11;
  OpenMintable private token = new OpenMintable("test", "test");

  function setUp() public override {
    super.setUp();

    _createGenericItem(tokenItem, string("ERC20"));
    vm.startPrank(deployer);
    _TokenPortalSystem.setItem(tokenItem, address(token), 3);
    vm.stopPrank();

    _setConfig("PORTAL_ITEM_IMPORT_TAX", [uint32(0), 0, 0, 0, 0, 0, 0, 0]); // 10 flat + 2% tax
    _setConfig("PORTAL_ITEM_EXPORT_TAX", [uint32(0), 0, 0, 0, 0, 0, 0, 0]); // 20 flat + 50% tax
  }

  function testTokenPortalBasic() public {
    ////////////
    // alice deposits 11 tokens
    token.mint(alice.owner, 11 ether);
    _approveERC20(address(token), alice.owner);
    _deposit(alice, tokenItem, LibERC20.toGameUnits(11 ether, 3));

    assertEq(token.balanceOf(alice.owner), 0); // no tokens in wallet
    assertEq(_getItemBal(alice, tokenItem), LibERC20.toGameUnits(11 ether, 3));

    ////////////
    // alice withdraws

    // initiate withdraw, receipt
    uint256 receiptID = _initiateWithdraw(alice, tokenItem, LibERC20.toGameUnits(5 ether, 3));
    assertEq(token.balanceOf(alice.owner), 0);
    assertEq(_getItemBal(alice, tokenItem), LibERC20.toGameUnits(6 ether, 3));

    // try to withdraw before time end
    vm.startPrank(alice.owner);
    vm.expectRevert();
    _TokenPortalSystem.claim(0);
    vm.stopPrank();

    // withdraw after time end
    _setTime(block.timestamp + LibTokenPortal.calcWithdrawalDelay(components));
    vm.startPrank(alice.owner);
    _TokenPortalSystem.claim(receiptID);
    vm.stopPrank();
    assertEq(token.balanceOf(alice.owner), 5 ether);
    assertEq(_getItemBal(alice, tokenItem), LibERC20.toGameUnits(6 ether, 3));

    ////////////
    // alice withdraws, and cancels

    // initiate withdraw
    receiptID = _initiateWithdraw(alice, tokenItem, LibERC20.toGameUnits(3 ether, 3));

    // cancel withdraw
    vm.startPrank(alice.owner);
    _TokenPortalSystem.cancel(receiptID);
    vm.stopPrank();

    // checking balances
    assertEq(token.balanceOf(alice.owner), 5 ether);
    assertEq(_getItemBal(alice, tokenItem), LibERC20.toGameUnits(6 ether, 3));
  }

  function testTokenPortalWithdrawCancel() public {
    // setup (deposit)
    token.mint(alice.owner, 11 ether);
    _approveERC20(address(token), alice.owner);
    _deposit(alice, tokenItem, LibERC20.toGameUnits(11 ether, 3));

    // cancelling
    uint256 receiptID = _initiateWithdraw(alice, tokenItem, LibERC20.toGameUnits(5 ether, 3));
    vm.startPrank(alice.owner);
    _TokenPortalSystem.cancel(receiptID);
    vm.stopPrank();
    assertEq(token.balanceOf(alice.owner), 0);
    assertEq(_getItemBal(alice, tokenItem), LibERC20.toGameUnits(11 ether, 3));
    vm.startPrank(alice.owner);
    vm.expectRevert();
    _TokenPortalSystem.claim(receiptID);
    vm.stopPrank();

    // getting admin blocked
    receiptID = _initiateWithdraw(alice, tokenItem, LibERC20.toGameUnits(5 ether, 3));
    vm.startPrank(deployer);
    _TokenPortalSystem.adminCancel(receiptID);
    vm.stopPrank();
    assertEq(token.balanceOf(alice.owner), 0);
    assertEq(_getItemBal(alice, tokenItem), LibERC20.toGameUnits(11 ether, 3));
    vm.startPrank(alice.owner);
    vm.expectRevert();
    _TokenPortalSystem.claim(receiptID);
    vm.stopPrank();
  }

  function testTokenPortalTax() public {
    // setup
    token.mint(alice.owner, 100 ether);
    _approveERC20(address(token), alice.owner);
    _setConfig("PORTAL_ITEM_IMPORT_TAX", [uint32(10), 200, 0, 0, 0, 0, 0, 0]); // 10 flat + 2% tax
    _setConfig("PORTAL_ITEM_EXPORT_TAX", [uint32(20), 5000, 0, 0, 0, 0, 0, 0]); // 20 flat + 50% tax

    // deposit
    uint256 expectedTax = LibERC20.toGameUnits(2 ether, 3) + 10; // in game units
    uint256 expectedAmt = LibERC20.toGameUnits(100 ether, 3) - expectedTax;
    _deposit(alice, tokenItem, LibERC20.toGameUnits(100 ether, 3));
    assertEq(token.balanceOf(alice.owner), 0);
    assertEq(_getItemBal(alice, tokenItem), expectedAmt);
    assertEq(_getItemBal(RESERVE_ACC, tokenItem), expectedTax);

    // withdraw
    uint256 reserveBal = expectedTax;
    uint256 expectedTax2 = expectedAmt / 2 + 20;
    uint256 expectedAmt2 = expectedAmt - expectedTax2;
    _initiateWithdraw(alice, tokenItem, expectedAmt);
    assertEq(token.balanceOf(alice.owner), 0);
    assertEq(_getItemBal(alice, tokenItem), 0);
    assertEq(_getItemBal(RESERVE_ACC, tokenItem), reserveBal + expectedTax2);
  }

  //////////////////
  // UTILS

  function _deposit(PlayerAccount memory acc, uint32 itemIndex, uint256 itemAmt) internal {
    vm.startPrank(acc.owner);
    _TokenPortalSystem.deposit(itemIndex, itemAmt);
    vm.stopPrank();
  }

  function _initiateWithdraw(
    PlayerAccount memory acc,
    uint32 itemIndex,
    uint256 itemAmt
  ) internal returns (uint256 receiptID) {
    vm.startPrank(acc.owner);
    receiptID = _TokenPortalSystem.withdraw(itemIndex, itemAmt);
    vm.stopPrank();
  }
}
