// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { GACHA_ID } from "libraries/LibGacha.sol";
import { GACHA_TICKET_INDEX } from "libraries/LibInventory.sol";
import "tests/utils/SetupTemplate.t.sol";
import { ERC20 } from "solmate/tokens/ERC20.sol";
import { CURRENCY } from "systems/GachaBuyTicketSystem.sol";

contract MintTicketTest is SetupTemplate {
  uint256 pubPrice;
  uint256 wlPrice;
  uint256 maxMints;
  uint256 maxPerAcc;

  ERC20 currency20;

  function setUp() public override {
    super.setUp();

    pubPrice = LibConfig.get(components, "MINT_PRICE_PUBLIC");
    wlPrice = LibConfig.get(components, "MINT_PRICE_WL");
    maxMints = LibConfig.get(components, "MINT_MAX_TOTAL");
    maxPerAcc = LibConfig.get(components, "MINT_MAX_PUBLIC");
    maxPerAcc = LibConfig.get(components, "MINT_MAX_WL");

    // creating items
    _createGenericItem(CURRENCY);
    currency20 = ERC20(_createERC20("currency", "CURRENCY"));
    _addItemERC20(CURRENCY, address(currency20));
    _createGenericItem(GACHA_TICKET_INDEX);

    // pre-approving erc20
    _approveERC20(address(currency20), alice.owner);
    _approveERC20(address(currency20), bob.owner);
  }

  /////////////////
  // TESTS

  function testMintWL() public {
    // WL Alice, not Bob
    _setFlag(alice.id, "MINT_WHITELISTED", true);

    // insufficient currency
    vm.prank(alice.owner);
    vm.expectRevert();
    _GachaBuyTicketSystem.buyWL();

    // good buy, enough currency
    _mintERC20(address(currency20), wlPrice, alice.owner);
    vm.prank(alice.owner);
    _GachaBuyTicketSystem.buyWL();

    // checking post buy state
    assertFalse(LibFlag.has(components, alice.id, "MINT_WHITELISTED"));
    assertEq(_getTokenBal(address(currency20), alice.owner), 0, "post buy mismatch currency");
    assertEq(_getItemBal(alice.id, GACHA_TICKET_INDEX), 1, "post buy mismatch ticket");
    assertEq(LibData.get(components, 0, 0, "MINT_NUM_TOTAL"), 1, "post buy mismatch mint num");

    // fail mint again
    _mintERC20(address(currency20), wlPrice, alice.owner);
    vm.prank(alice.owner);
    vm.expectRevert();
    _GachaBuyTicketSystem.buyWL();

    // fail mint not whitelisted
    _mintERC20(address(currency20), wlPrice, bob.owner);
    vm.prank(bob.owner);
    vm.expectRevert();
    _GachaBuyTicketSystem.buyWL();
  }

  function testMintPublic(uint32 _startingCurr, uint256 amt) public {
    // setup
    _setConfig("MINT_PUBLIC_OPEN", 1);
    uint256 startingCurr = uint256(_startingCurr);
    _mintERC20(address(currency20), startingCurr, alice.owner);

    if (amt > maxPerAcc) {
      // failed mint
      vm.prank(alice.owner);
      if (amt > maxMints) vm.expectRevert("max mints reached");
      else vm.expectRevert("max mints per account reached");
      _GachaBuyTicketSystem.buyPublic(amt);
    } else {
      uint256 cost = pubPrice * amt;
      if (startingCurr < cost) {
        // not enough funds
        vm.prank(alice.owner);
        vm.expectRevert();
        _GachaBuyTicketSystem.buyPublic(amt);
      } else {
        // enough funds, mint
        vm.prank(alice.owner);
        _GachaBuyTicketSystem.buyPublic(amt);
        // check post-buy state
        assertEq(
          _getTokenBal(address(currency20), alice.owner),
          (startingCurr - cost) * 1e15,
          "post buy mismatch currency"
        );
        assertEq(_getItemBal(alice.id, GACHA_TICKET_INDEX), amt, "post buy mismatch ticket");
        assertEq(
          LibData.get(components, alice.id, 0, "MINT_NUM"),
          amt,
          "post buy mismatch mint num"
        );
      }
    }
  }

  // TODO: update this with start time configs
  function testMintPublicOpen() public {
    // setup
    _mintERC20(address(currency20), pubPrice, alice.owner);

    // public mint before open
    vm.prank(alice.owner);
    vm.expectRevert("public mint closed");
    _GachaBuyTicketSystem.buyPublic(1);

    // open public mint
    _setConfig("MINT_PUBLIC_OPEN", 1);
    vm.prank(alice.owner);
    _GachaBuyTicketSystem.buyPublic(1);
  }

  function testMintPublicMultiple() public {
    // setup
    _setConfig("MINT_PUBLIC_OPEN", 1);
    maxPerAcc = 5;
    _setConfig("MINT_MAX_PUBLIC_ACC", maxPerAcc);
    _mintERC20(address(currency20), pubPrice * maxPerAcc, alice.owner);

    // valid mints, till 5
    vm.prank(alice.owner);
    _GachaBuyTicketSystem.buyPublic(0);
    assertEq(_getItemBal(alice.id, GACHA_TICKET_INDEX), 0, "post buy mismatch ticket");
    vm.prank(alice.owner);
    _GachaBuyTicketSystem.buyPublic(1);
    assertEq(_getItemBal(alice.id, GACHA_TICKET_INDEX), 1, "post buy mismatch ticket");
    vm.prank(alice.owner);
    _GachaBuyTicketSystem.buyPublic(2);
    assertEq(_getItemBal(alice.id, GACHA_TICKET_INDEX), 3, "post buy mismatch ticket");
    vm.prank(alice.owner);
    _GachaBuyTicketSystem.buyPublic(1);
    assertEq(_getItemBal(alice.id, GACHA_TICKET_INDEX), 4, "post buy mismatch ticket");

    // failed mint, exceeding max
    vm.prank(alice.owner);
    vm.expectRevert("max mints per account reached");
    _GachaBuyTicketSystem.buyPublic(2);
    vm.prank(alice.owner);
    vm.expectRevert("max mints per account reached");
    _GachaBuyTicketSystem.buyPublic(3);

    // valid mint
    vm.prank(alice.owner);
    _GachaBuyTicketSystem.buyPublic(1);
    assertEq(_getItemBal(alice.id, GACHA_TICKET_INDEX), 5, "post buy mismatch ticket");
  }

  function testMintMax(uint) public {
    // setup
    _setConfig("MINT_PUBLIC_OPEN", 1);
    _setFlag(alice.id, "MINT_WHITELISTED", true);
    _setFlag(bob.id, "MINT_WHITELISTED", true);
    _mintERC20(address(currency20), wlPrice, alice.owner);
    _mintERC20(address(currency20), wlPrice, bob.owner);

    // WL minting
    vm.prank(alice.owner);
    _GachaBuyTicketSystem.buyWL();
    assertEq(LibData.get(components, 0, 0, "MINT_NUM_TOTAL"), 1, "post buy mismatch mint num");
    vm.prank(bob.owner);
    _GachaBuyTicketSystem.buyWL();
    assertEq(LibData.get(components, 0, 0, "MINT_NUM_TOTAL"), 2, "post buy mismatch mint num");

    // public minting, till max
    _setData(0, 0, "MINT_NUM_TOTAL", maxMints - 9);
    _mintERC20(address(currency20), pubPrice * 5, alice.owner);
    vm.prank(alice.owner);
    _GachaBuyTicketSystem.buyPublic(5);
    // failed mint, exceeding max
    _mintERC20(address(currency20), pubPrice * 5, bob.owner);
    vm.prank(bob.owner);
    vm.expectRevert("max mints reached");
    _GachaBuyTicketSystem.buyPublic(5);
    // ok mint
    vm.prank(bob.owner);
    _GachaBuyTicketSystem.buyPublic(4);
  }
}
