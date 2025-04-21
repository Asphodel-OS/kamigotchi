// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { GACHA_ID } from "libraries/LibGacha.sol";
import { GACHA_TICKET_INDEX } from "libraries/LibInventory.sol";
import "tests/utils/SetupTemplate.t.sol";
import { ERC20 } from "solmate/tokens/ERC20.sol";
import { CURRENCY } from "systems/GachaBuyTicketSystem.sol";

contract MintTicketTest is SetupTemplate {
  uint256 maxMints; // total mints allowed

  uint256 mintsWL; // whitelist mints allowed per account
  uint256 priceWL; // price of whitelist mint
  uint256 startWL; // start epoch ts of whitelist mint

  uint256 mintsPublic; // public mints allowed per account
  uint256 pricePublic; // price of public mint
  uint256 startPublic; // start epoch ts of public mint

  ERC20 currency20;

  function setUp() public override {
    super.setUp();

    // below values are fed in from deployment/world/state/configs.ts
    maxMints = LibConfig.get(components, "MINT_MAX_TOTAL");

    mintsWL = LibConfig.get(components, "MINT_MAX_WL");
    priceWL = LibConfig.get(components, "MINT_PRICE_WL");
    startWL = LibConfig.get(components, "MINT_START_WL");

    mintsPublic = LibConfig.get(components, "MINT_MAX_PUBLIC");
    pricePublic = LibConfig.get(components, "MINT_PRICE_PUBLIC");
    startPublic = LibConfig.get(components, "MINT_START_PUBLIC");

    // creating items
    _createGenericItem(CURRENCY);
    currency20 = ERC20(_createERC20("currency", "CURRENCY"));
    _addItemERC20(CURRENCY, address(currency20));
    _createGenericItem(GACHA_TICKET_INDEX);

    // pre-approving erc20
    _approveERC20(address(currency20), alice.owner);
    _approveERC20(address(currency20), bob.owner);
    _approveERC20(address(currency20), charlie.owner);
  }

  // check some basic, relative values between WL and Public mint configs
  function testConfigs() public {
    assertGt(mintsPublic, mintsWL); // more mints allowed for public than WL
    assertGt(pricePublic, priceWL); // greater price for public than WL
    assertGt(startPublic, startWL); // public mint starts later than WL
  }

  /////////////////
  // WHITELIST TESTS

  // test that whitelisting does indeed work even across multiple accounts
  function testWhitelisting(bool aWL, bool bWL, bool cWL) public {
    // set the whitelisted flags
    _setFlag(alice.id, "MINT_WHITELISTED", aWL);
    _setFlag(bob.id, "MINT_WHITELISTED", bWL);
    _setFlag(charlie.id, "MINT_WHITELISTED", cWL);

    // mint some tokens to everyone
    _mintERC20(address(currency20), priceWL, alice.owner);
    _mintERC20(address(currency20), priceWL, bob.owner);
    _mintERC20(address(currency20), priceWL, charlie.owner);

    // set the start time of the whitelist mint to be in the past
    uint256 time = _getTime();
    _setConfig("MINT_START_WL", time);
    _fastForward(1000);

    // check alice
    vm.prank(alice.owner);
    if (!aWL) vm.expectRevert("not whitelisted");
    _GachaBuyTicketSystem.buyWL();

    // check bob
    vm.prank(bob.owner);
    if (!bWL) vm.expectRevert("not whitelisted");
    _GachaBuyTicketSystem.buyWL();

    // check charlie
    vm.prank(charlie.owner);
    if (!cWL) vm.expectRevert("not whitelisted");
    _GachaBuyTicketSystem.buyWL();
  }

  // ensure WL mints are not accessible prior to start time
  function testWLStart(uint256 currTs, uint32 startDelta, bool flip) public {
    vm.assume(currTs < 1 << 254); // healthy bounds to prevent overflow
    vm.assume(currTs > 1 << 32); // healthy bounds to prevent underflow

    // set up alice for success
    _setFlag(alice.id, "MINT_WHITELISTED", true);
    _mintERC20(address(currency20), priceWL, alice.owner);

    // shift current and start time
    uint256 startTime = currTs;
    if (flip) startTime -= startDelta;
    else startTime += startDelta;
    _setConfig("MINT_START_WL", startTime);
    _setTime(currTs);

    // attempt to mint
    vm.prank(alice.owner);
    if (startDelta > 0 && !flip) vm.expectRevert("whitelist mint has not yet started");
    _GachaBuyTicketSystem.buyWL();
  }

  // test that the WL mint limit is enforced and state is updated correctly
  function testWLSolo(uint8 limit, uint8 numMints) public {
    vm.assume(numMints < 16); // keep it reasonable
    vm.assume(limit < 32);

    // set up alice for success
    uint256 tokenBalInitial = priceWL * limit;
    _setFlag(alice.id, "MINT_WHITELISTED", true);
    _mintERC20(address(currency20), tokenBalInitial, alice.owner);

    // configure mint
    _setConfig("MINT_MAX_WL", limit);
    _setConfig("MINT_START_WL", _getTime());
    _fastForward(1000);

    // attempt mints
    uint8 numMinted = 0;
    vm.startPrank(alice.owner);
    for (uint8 i = 0; i < numMints; i++) {
      if (i >= limit) vm.expectRevert("max whitelist mint per account reached");
      else numMinted++;
      _GachaBuyTicketSystem.buyWL();
    }

    uint256 tokenBal = _getTokenBal(address(currency20), alice.owner);
    uint256 tokenBalRemaining = (tokenBalInitial - (priceWL * numMinted)) * 1e15; // these unit conversions are gonna bite us eventually..
    assertEq(tokenBal, tokenBalRemaining, "unexpected token balance");
    assertEq(_getItemBal(alice.id, GACHA_TICKET_INDEX), numMinted, "post buy mismatch ticket");
    assertEq(LibData.get(components, 0, 0, "MINT_NUM_TOTAL"), numMinted, "unexpected mint amount");
    assertEq(
      LibData.get(components, alice.id, 0, "MINT_NUM_TOTAL"),
      numMinted,
      "unexpected mint amount"
    );
  }

  /////////////////
  // PUBLIC TESTS

  // ensure public mints are not accessible prior to start time
  function testPublicStart(uint256 currTs, uint32 startDelta, bool flip) public {
    vm.assume(currTs < 1 << 254); // healthy bounds to prevent overflow
    vm.assume(currTs > 1 << 32); // healthy bounds to prevent underflow

    // set up alice for success
    _mintERC20(address(currency20), pricePublic, alice.owner);

    // shift current and start time
    uint256 startTime = currTs;
    if (flip) startTime -= startDelta;
    else startTime += startDelta;
    _setConfig("MINT_START_PUBLIC", startTime);
    _setTime(currTs);

    // attempt to mint
    vm.prank(alice.owner);
    if (startDelta > 0 && !flip) vm.expectRevert("public mint has not yet started");
    _GachaBuyTicketSystem.buyPublic(1);
  }

  // test that the Public mint limit is enforced and state is updated correctly
  function testPublicSolo(uint8 limit, uint8 numMints) public {
    vm.assume(numMints < 16); // keep it reasonable
    vm.assume(limit < 32);

    // set up alice for success
    uint256 tokenBalInitial = pricePublic * limit;
    _mintERC20(address(currency20), tokenBalInitial, alice.owner);

    // configure mint
    _setConfig("MINT_MAX_PUBLIC", limit);
    _setConfig("MINT_START_PUBLIC", _getTime());
    _fastForward(1000);

    // attempt mints
    uint256 numMinted = 0;
    uint256 toMint = 0; // quanitty to mint
    vm.startPrank(alice.owner);
    for (uint256 i = 0; i < numMints; i++) {
      toMint = uint256(keccak256(abi.encodePacked(limit, numMints, i))) % 10;
      if (toMint == 0) vm.expectRevert("cannot mint 0 tickets");
      else if (numMinted + toMint > limit) vm.expectRevert("max public mint per account reached");
      else numMinted += toMint;
      _GachaBuyTicketSystem.buyPublic(toMint);
    }

    uint256 tokenBal = _getTokenBal(address(currency20), alice.owner);
    uint256 tokenBalRemaining = (tokenBalInitial - (pricePublic * numMinted)) * 1e15; // these unit conversions are gonna bite us eventually..
    assertEq(tokenBal, tokenBalRemaining, "unexpected token balance");
    assertEq(_getItemBal(alice.id, GACHA_TICKET_INDEX), numMinted, "post buy mismatch ticket");
    assertEq(LibData.get(components, 0, 0, "MINT_NUM_TOTAL"), numMinted, "unexpected mint amount");
    assertEq(
      LibData.get(components, alice.id, 0, "MINT_NUM_TOTAL"),
      numMinted,
      "unexpected mint amount"
    );
  }
}
