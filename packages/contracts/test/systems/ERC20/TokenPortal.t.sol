// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";
import { Vm } from "forge-std/Vm.sol";

import { ID as HasFlagCompID } from "components/HasFlagComponent.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibTokenPortal, RESERVE_ACC } from "libraries/LibTokenPortal.sol";
import { OPERATOR_LANE_FLAG, TokenPortalSystem } from "systems/TokenPortalSystem.sol";

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
    _TokenPortalSystem.setLaneItem(tokenItem, true);
    _TokenPortalSystem.adminToggleEnabled(true); // portal boots disabled
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

  /// @notice After switching portal ERC20, new withdrawals pay out in the new token; liquidity in the old token remains in TokenHolder.
  function testTokenPortal_changeTokenAddress_newWithdrawalsUseNewToken_oldTokenUntouched() public {
    OpenMintable tokenOld = token;
    OpenMintable tokenNew = new OpenMintable("newOnyx", "NOX");

    tokenOld.mint(alice.owner, 11 ether);
    _approveERC20(address(tokenOld), alice.owner);
    _deposit(alice, tokenItem, LibERC20.toGameUnits(11 ether, 3));

    address holder = address(_TokenHolderComponent);
    uint256 oldInHolderAfterDeposit = tokenOld.balanceOf(holder);
    assertEq(oldInHolderAfterDeposit, 11 ether);

    vm.startPrank(deployer);
    _TokenPortalSystem.unsetItem(tokenItem);
    _TokenPortalSystem.setItem(tokenItem, address(tokenNew), 3);
    vm.stopPrank();

    assertEq(tokenOld.balanceOf(holder), oldInHolderAfterDeposit);

    uint256 invBal = _getItemBal(alice, tokenItem);
    uint256 owed = LibERC20.toTokenUnits(invBal, 3);
    tokenNew.mint(holder, owed);

    uint256 receiptID = _initiateWithdraw(alice, tokenItem, invBal);

    _setTime(block.timestamp + LibTokenPortal.calcWithdrawalDelay(components));
    vm.prank(alice.owner);
    _TokenPortalSystem.claim(receiptID);

    assertEq(tokenNew.balanceOf(alice.owner), owed);
    assertEq(tokenOld.balanceOf(holder), oldInHolderAfterDeposit);
    assertEq(tokenOld.balanceOf(alice.owner), 0);
  }

  /// @notice Pending receipt created with token A pays out token A after portal switches to token B (no new-token liquidity needed for that claim).
  function testTokenPortal_changeTokenAddress_pendingReceiptPaysOldTokenOnly() public {
    OpenMintable tokenOld = token;
    OpenMintable tokenNew = new OpenMintable("altOnyx", "AOX");

    tokenOld.mint(alice.owner, 11 ether);
    _approveERC20(address(tokenOld), alice.owner);
    _deposit(alice, tokenItem, LibERC20.toGameUnits(11 ether, 3));

    address holder = address(_TokenHolderComponent);
    uint256 pendingGame = LibERC20.toGameUnits(5 ether, 3);
    uint256 receiptID = _initiateWithdraw(alice, tokenItem, pendingGame);

    vm.startPrank(deployer);
    _TokenPortalSystem.unsetItem(tokenItem);
    _TokenPortalSystem.setItem(tokenItem, address(tokenNew), 3);
    vm.stopPrank();

    assertEq(tokenNew.balanceOf(holder), 0);

    _setTime(block.timestamp + LibTokenPortal.calcWithdrawalDelay(components));
    vm.prank(alice.owner);
    _TokenPortalSystem.claim(receiptID);

    assertEq(tokenOld.balanceOf(alice.owner), 5 ether);
    assertEq(tokenNew.balanceOf(alice.owner), 0);
    assertEq(tokenOld.balanceOf(holder), 11 ether - 5 ether);
  }

  /// @notice With portal mapping cleared via unsetItem, new deposits and new withdrawals revert; an existing receipt should still be claimable from TokenHolder using the token address stored on the receipt.
  function testTokenPortal_unsetItem_blocksNewFlow_existingReceiptClaimable() public {
    token.mint(alice.owner, 11 ether);
    _approveERC20(address(token), alice.owner);
    _deposit(alice, tokenItem, LibERC20.toGameUnits(11 ether, 3));

    uint256 receiptID = _initiateWithdraw(alice, tokenItem, LibERC20.toGameUnits(4 ether, 3));

    vm.startPrank(deployer);
    _TokenPortalSystem.unsetItem(tokenItem);
    vm.stopPrank();

    vm.expectRevert(bytes("Token Portal: item not registered"));
    vm.startPrank(alice.owner);
    _TokenPortalSystem.deposit(tokenItem, LibERC20.toGameUnits(1 ether, 3));
    vm.stopPrank();

    vm.expectRevert(bytes("Token Portal: item not registered"));
    vm.startPrank(alice.owner);
    _TokenPortalSystem.withdraw(tokenItem, LibERC20.toGameUnits(1 ether, 3));
    vm.stopPrank();

    // SYSTEM NOTE: after unsetItem, TokenPortal.claim still succeeds because LibTokenPortal transfers using the receipt's token + wei amount.
    // itemScales[itemIndex] is cleared (0), which can skew logging / any path that recomputes item amounts from wei using the live portal scale.
    _setTime(block.timestamp + LibTokenPortal.calcWithdrawalDelay(components));
    vm.prank(alice.owner);
    _TokenPortalSystem.claim(receiptID);

    assertEq(token.balanceOf(alice.owner), 4 ether);
  }

  //////////////////
  // OPERATOR LANE

  /// @notice the operator alone runs withdraw and claim; the payout lands in its own wallet
  function testOperatorLane_operatorWithdrawsAndClaims() public {
    uint256 units = _fund(alice, 6 ether);

    vm.prank(alice.operator);
    uint256 receiptID = _TokenPortalSystem.withdrawToOperator(tokenItem, units);
    assertTrue(LibFlag.has(components, receiptID, OPERATOR_LANE_FLAG), "lane flag missing");
    assertEq(_getItemBal(alice, tokenItem), 0);

    vm.prank(alice.operator);
    vm.expectRevert("withdrawal not ready");
    _TokenPortalSystem.claim(receiptID);

    _setTime(block.timestamp + LibTokenPortal.calcWithdrawalDelay(components));
    vm.prank(alice.operator);
    _TokenPortalSystem.claim(receiptID);
    assertEq(token.balanceOf(alice.operator), 6 ether, "operator not paid");
    assertEq(token.balanceOf(alice.owner), 0, "owner paid on operator lane");
    assertTrue(LibFlag.has(components, receiptID, OPERATOR_LANE_FLAG), "lane flag lost on settle");
    // a settled receipt cannot be claimed again, flag or not
    vm.prank(alice.operator);
    vm.expectRevert("not receipt owner");
    _TokenPortalSystem.claim(receiptID);
  }

  /// @notice the owner may drive an operator-lane receipt; the payout still goes to the operator
  function testOperatorLane_ownerClaimsToOperator() public {
    uint256 units = _fund(alice, 2 ether);
    vm.prank(alice.owner);
    uint256 receiptID = _TokenPortalSystem.withdrawToOperator(tokenItem, units);

    _setTime(block.timestamp + LibTokenPortal.calcWithdrawalDelay(components));
    vm.prank(alice.owner);
    _TokenPortalSystem.claim(receiptID);
    assertEq(token.balanceOf(alice.operator), 2 ether);
    assertEq(token.balanceOf(alice.owner), 0);
  }

  /// @notice owner receipts are untouched: an operator can neither claim nor cancel them
  function testOperatorLane_operatorCannotTouchOwnerReceipt() public {
    uint256 units = _fund(alice, 3 ether);
    uint256 receiptID = _initiateWithdraw(alice, tokenItem, units);
    assertFalse(LibFlag.has(components, receiptID, OPERATOR_LANE_FLAG));

    _setTime(block.timestamp + LibTokenPortal.calcWithdrawalDelay(components));
    vm.prank(alice.operator);
    vm.expectRevert("not receipt owner");
    _TokenPortalSystem.claim(receiptID);
    vm.prank(alice.operator);
    vm.expectRevert("not receipt owner");
    _TokenPortalSystem.cancel(receiptID);

    vm.prank(alice.owner);
    _TokenPortalSystem.claim(receiptID);
    assertEq(token.balanceOf(alice.owner), 3 ether);
    assertEq(token.balanceOf(alice.operator), 0);
  }

  /// @notice a stranger, or another account's operator, cannot touch a lane receipt
  function testOperatorLane_othersRefused() public {
    uint256 units = _fund(alice, 1 ether);
    vm.prank(alice.operator);
    uint256 receiptID = _TokenPortalSystem.withdrawToOperator(tokenItem, units);
    _setTime(block.timestamp + LibTokenPortal.calcWithdrawalDelay(components));

    vm.prank(bob.operator);
    vm.expectRevert("not receipt owner");
    _TokenPortalSystem.claim(receiptID);
    vm.prank(bob.owner);
    vm.expectRevert("not receipt owner");
    _TokenPortalSystem.cancel(receiptID);
  }

  /// @notice the payout follows the operator current at claim time, not at withdraw time
  function testOperatorLane_rotationPaysCurrentOperator() public {
    uint256 units = _fund(alice, 4 ether);
    address oldOperator = alice.operator;
    address newOperator = address(0xA11CE0);

    vm.prank(oldOperator);
    uint256 receiptID = _TokenPortalSystem.withdrawToOperator(tokenItem, units);

    vm.prank(alice.owner);
    _AccountSetOperatorSystem.executeTyped(newOperator);
    _setTime(block.timestamp + LibTokenPortal.calcWithdrawalDelay(components));

    vm.prank(oldOperator);
    vm.expectRevert("not receipt owner");
    _TokenPortalSystem.claim(receiptID);

    vm.prank(newOperator);
    _TokenPortalSystem.claim(receiptID);
    assertEq(token.balanceOf(newOperator), 4 ether);
    assertEq(token.balanceOf(oldOperator), 0);
  }

  /// @notice with no operator set the claim is refused; the owner can still cancel
  function testOperatorLane_noOperatorRevertsThenCancel() public {
    uint256 units = _fund(alice, 1 ether);
    vm.prank(alice.operator);
    uint256 receiptID = _TokenPortalSystem.withdrawToOperator(tokenItem, units);

    vm.prank(alice.owner);
    _AccountSetOperatorSystem.executeTyped(address(0));
    _setTime(block.timestamp + LibTokenPortal.calcWithdrawalDelay(components));

    vm.prank(alice.owner);
    vm.expectRevert("Token Portal: no operator");
    _TokenPortalSystem.claim(receiptID);

    vm.prank(alice.owner);
    _TokenPortalSystem.cancel(receiptID);
    assertEq(_getItemBal(alice, tokenItem), units);
  }

  /// @notice the operator can cancel its own lane receipt; the shards return to the account
  function testOperatorLane_operatorCancels() public {
    uint256 units = _fund(alice, 2 ether);
    vm.prank(alice.operator);
    uint256 receiptID = _TokenPortalSystem.withdrawToOperator(tokenItem, units);
    assertEq(_getItemBal(alice, tokenItem), 0);

    vm.prank(alice.operator);
    _TokenPortalSystem.cancel(receiptID);
    assertEq(_getItemBal(alice, tokenItem), units);
  }

  /// @notice admin cancel returns the shards on either lane and never touches the flag
  function testOperatorLane_adminCancel() public {
    uint256 units = _fund(alice, 2 ether);
    vm.prank(alice.operator);
    uint256 laneReceipt = _TokenPortalSystem.withdrawToOperator(tokenItem, units / 2);
    uint256 ownerReceipt = _initiateWithdraw(alice, tokenItem, units / 2);

    vm.startPrank(deployer);
    _TokenPortalSystem.adminCancel(laneReceipt);
    vm.recordLogs();
    _TokenPortalSystem.adminCancel(ownerReceipt);
    vm.stopPrank();
    assertEq(_getItemBal(alice, tokenItem), units);
    assertFalse(LibFlag.has(components, ownerReceipt, OPERATOR_LANE_FLAG));
    // no flag write for an owner receipt: no log from the flag component
    address flagComp = getAddrByID(components, HasFlagCompID);
    Vm.Log[] memory logs = vm.getRecordedLogs();
    for (uint256 i; i < logs.length; i++) assertTrue(logs[i].emitter != flagComp, "flag write");

    vm.prank(deployer);
    vm.expectRevert("Token Portal: no receipt");
    _TokenPortalSystem.adminCancel(laneReceipt);
  }

  /// @notice an account owner cannot be named as another account's operator, so the
  ///         owner-first resolution can never route an owner to a stranger's account
  function testOperatorLane_ownerCannotBeHijackedAsOperator() public {
    vm.prank(bob.owner);
    vm.expectRevert("Account: Operator is an account owner");
    _AccountSetOperatorSystem.executeTyped(alice.owner);

    address fresh = address(0xF4E5);
    vm.prank(fresh);
    vm.expectRevert("Account: Operator is an account owner");
    _AccountRegisterSystem.executeTyped(alice.owner, "fresh");

    uint256 units = _fund(alice, 1 ether);
    vm.prank(alice.owner);
    uint256 receiptID = _TokenPortalSystem.withdrawToOperator(tokenItem, units);
    assertEq(LibTokenPortal.getReceiptAccount(components, receiptID), alice.id);
  }

  /// @notice only items enabled for the lane can use it; the owner lane is unaffected
  function testOperatorLane_itemGate() public {
    uint32 otherItem = 12;
    OpenMintable other = new OpenMintable("other", "OTH");
    _createGenericItem(otherItem, string("ERC20"));
    vm.prank(deployer);
    _TokenPortalSystem.setItem(otherItem, address(other), 2);
    uint256 units = LibERC20.toGameUnits(1 ether, 2);
    other.mint(alice.owner, 1 ether);
    _approveERC20(address(other), alice.owner);
    _deposit(alice, otherItem, units);

    vm.prank(alice.operator);
    vm.expectRevert("Token Portal: item not on the operator lane");
    _TokenPortalSystem.withdrawToOperator(otherItem, units);
    _initiateWithdraw(alice, otherItem, units);

    vm.prank(deployer);
    vm.expectRevert("Token Portal: item not registered");
    _TokenPortalSystem.setLaneItem(999, true);
  }

  /// @notice a paused lane receipt cannot be claimed; the portal switch gates settlement too
  function testOperatorLane_pauseAndSwitch() public {
    uint256 units = _fund(alice, 1 ether);
    vm.prank(alice.operator);
    uint256 receiptID = _TokenPortalSystem.withdrawToOperator(tokenItem, units);
    _setTime(block.timestamp + LibTokenPortal.calcWithdrawalDelay(components));

    vm.prank(deployer);
    _TokenPortalSystem.adminPause(receiptID);
    vm.prank(alice.operator);
    vm.expectRevert();
    _TokenPortalSystem.claim(receiptID);
    vm.prank(deployer);
    _TokenPortalSystem.adminUnpause(receiptID);

    vm.prank(deployer);
    _TokenPortalSystem.adminToggleEnabled(false);
    vm.prank(alice.operator);
    vm.expectRevert("Token Portal: disabled");
    _TokenPortalSystem.claim(receiptID);
    vm.prank(deployer);
    _TokenPortalSystem.adminToggleEnabled(true);

    vm.prank(alice.operator);
    _TokenPortalSystem.claim(receiptID);
    assertEq(token.balanceOf(alice.operator), 1 ether);
  }

  /// @notice the lane is gated by the same portal switch and item registration
  function testOperatorLane_gates() public {
    _fund(alice, 1 ether);
    vm.prank(alice.operator);
    vm.expectRevert("Token Portal: item not registered");
    _TokenPortalSystem.withdrawToOperator(999, 1);

    vm.prank(deployer);
    _TokenPortalSystem.adminToggleEnabled(false);
    vm.prank(alice.operator);
    vm.expectRevert("Token Portal: disabled");
    _TokenPortalSystem.withdrawToOperator(tokenItem, 1);
  }

  /// @notice a token that re-enters claim during its transfer is paid once. the token is
  ///         alice's operator so the re-entrant claim passes auth, and the vault holds
  ///         more than her receipt so a double pay would not fail on balance
  function testTokenPortal_laneClaimIsReentrancySafe() public {
    ReentrantToken evil = new ReentrantToken(_TokenPortalSystem);
    uint32 evilItem = 13;
    _createGenericItem(evilItem, string("ERC20"));
    vm.startPrank(deployer);
    _TokenPortalSystem.setItem(evilItem, address(evil), 3);
    _TokenPortalSystem.setLaneItem(evilItem, true);
    vm.stopPrank();
    vm.prank(alice.owner);
    _AccountSetOperatorSystem.executeTyped(address(evil));

    uint256 units = LibERC20.toGameUnits(4 ether, 3);
    evil.mint(alice.owner, 4 ether);
    _approveERC20(address(evil), alice.owner);
    _deposit(alice, evilItem, units);
    evil.mint(bob.owner, 4 ether);
    _approveERC20(address(evil), bob.owner);
    _deposit(bob, evilItem, units);

    vm.prank(alice.owner);
    uint256 receiptID = _TokenPortalSystem.withdrawToOperator(evilItem, units);
    evil.arm(receiptID);

    _setTime(block.timestamp + LibTokenPortal.calcWithdrawalDelay(components));
    vm.prank(alice.owner);
    _TokenPortalSystem.claim(receiptID);
    assertTrue(evil.reentered(), "re-entry path not exercised");
    assertEq(evil.balanceOf(address(evil)), 4 ether, "paid other than once");
  }

  //////////////////
  // UTILS

  /// @dev mints, approves and deposits for acc; returns the item units credited
  function _fund(PlayerAccount memory acc, uint256 tokenAmt) internal returns (uint256 units) {
    units = LibERC20.toGameUnits(tokenAmt, 3);
    token.mint(acc.owner, tokenAmt);
    _approveERC20(address(token), acc.owner);
    _deposit(acc, tokenItem, units);
  }

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

/// @dev erc20 whose transfer re-enters the portal claim for an armed receipt
contract ReentrantToken is OpenMintable {
  TokenPortalSystem private portal;
  uint256 private receiptID;
  bool public reentered;

  constructor(TokenPortalSystem _portal) OpenMintable("evil", "EVIL") {
    portal = _portal;
  }

  function arm(uint256 _receiptID) external {
    receiptID = _receiptID;
  }

  function transfer(address to, uint256 amount) public override returns (bool) {
    bool ok = super.transfer(to, amount);
    if (receiptID != 0 && !reentered) {
      reentered = true;
      try portal.claim(receiptID) {} catch {}
    }
    return ok;
  }
}
