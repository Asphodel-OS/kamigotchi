// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

/// @notice basic system testing for systems that are not directly tested elsewhere
/** @dev
 * does not check for any state – just to see if the systems are working
 * uses the default setup template setup (uses template functions when possible)
 * this is to check for the basic world state and ensure no operational errors
 */
contract TokenBridgeTest is SetupTemplate {
  uint32 tokenItem = 11;
  OpenMintable token = new OpenMintable("test", "test");

  function setUp() public override {
    super.setUp();

    _createGenericItem(tokenItem);
    _addItemERC20(tokenItem, address(token), 3);
    vm.startPrank(deployer);
    _TokenPortalSystem.addItem(tokenItem, address(token));
    __ItemRegistrySystem.addFlag(tokenItem, "ERC20_BRIDGEABLE");
    vm.stopPrank();
  }

  function testBridgeBasic() public {
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
    _setTime(block.timestamp + LibTokenBridge.getWithdrawDelay(components));
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

  function testBridgeWithdrawCancel() public {
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
    _TokenPortalSystem.adminBlock(receiptID);
    vm.stopPrank();
    assertEq(token.balanceOf(alice.owner), 0);
    assertEq(_getItemBal(alice, tokenItem), LibERC20.toGameUnits(11 ether, 3));
    vm.startPrank(alice.owner);
    vm.expectRevert();
    _TokenPortalSystem.claim(receiptID);
    vm.stopPrank();
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
    receiptID = _TokenPortalSystem.initiateWithdraw(itemIndex, itemAmt);
    vm.stopPrank();
  }
}
