// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

// import { GACHA_ID } from "libraries/LibGacha.sol";
import { GACHA_TICKET_INDEX } from "libraries/LibInventory.sol";
import "tests/utils/SetupTemplate.t.sol";
import { ERC20 } from "solmate/tokens/ERC20.sol";
import { CURRENCY } from "systems/GachaBuyTicketSystem.sol";

contract MintTicketTest is SetupTemplate {
  uint256 private maxMints; // total mints allowed

  uint256 private mintsWL; // whitelist mints allowed per account
  uint256 private priceWL; // price of whitelist mint
  uint256 private startWL; // start epoch ts of whitelist mint

  uint256 private mintsPublic; // public mints allowed per account
  uint256 private pricePublic; // price of public mint
  uint256 private startPublic; // start epoch ts of public mint

  ERC20 private currency20;

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
  function testWLStart(uint256 _currTs, uint32 _startDelta, bool _flip) public {
    vm.assume(_currTs < 1 << 254); // healthy bounds to prevent overflow
    vm.assume(_currTs > 1 << 32); // healthy bounds to prevent underflow

    // set up alice for success
    _setFlag(alice.id, "MINT_WHITELISTED", true);
    _mintERC20(address(currency20), priceWL, alice.owner);

    // shift current and start time
    uint256 startTime = _currTs;
    if (_flip) startTime -= _startDelta;
    else startTime += _startDelta;
    _setConfig("MINT_START_WL", startTime);
    _setTime(_currTs);

    // attempt to mint
    vm.prank(alice.owner);
    if (_startDelta > 0 && !_flip) vm.expectRevert("whitelist mint has not yet started");
    _GachaBuyTicketSystem.buyWL();
  }

  // test that the WL mint limit is enforced and state is updated correctly
  function testWLSolo(uint8 limit, uint8 _numMints) public {
    vm.assume(_numMints < 16); // keep it reasonable
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
    for (uint8 i = 0; i < _numMints; i++) {
      if (i >= limit) vm.expectRevert("max whitelist mint per account reached");
      else numMinted++;
      _GachaBuyTicketSystem.buyWL();
    }

    // check final state
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

  /**
   *  test whitelist minting with multiple accounts and configurations.
   *  @param _numAccounts number of accounts participating in the mint
   *  @param _accLimit maximum number of whitelist mints per account
   *  @param _numMints number of mints to attempt
   */
  function testWLMulti(uint8 _numAccounts, uint8 _accLimit, uint32 _numMints) public {
    vm.assume(_numAccounts < 10 && _numAccounts > 0); // stay within our test setup total accounts
    vm.assume(_numMints < 100 && _numMints > 10); // keep it reasonable
    vm.assume(_accLimit < 32 && _accLimit > 0);

    // useful variables
    uint256 accIndex;
    PlayerAccount storage account;

    // fund all accounts and whitelist every other one
    uint256 tokenBalInitial = priceWL * _accLimit;
    for (uint256 i = 0; i < _numAccounts; i++) {
      account = _accounts[i];
      _mintERC20(address(currency20), tokenBalInitial, account.owner);
      _approveERC20(address(currency20), account.owner);
      if (i % 2 == 0) _setFlag(account.id, "MINT_WHITELISTED", true);
    }

    // configure mint
    _setConfig("MINT_MAX_WL", _accLimit);
    _setConfig("MINT_START_WL", _getTime());
    _fastForward(1000);

    // attempt mints
    uint256[] memory numMinted = new uint256[](_numAccounts);
    for (uint256 i = 0; i < _numMints; i++) {
      // pick a random account
      accIndex = uint256(keccak256(abi.encodePacked(_accLimit, _numMints, i))) % _numAccounts;
      account = _accounts[accIndex];

      // mint
      vm.prank(account.owner);
      if (account.index % 2 != 0) {
        vm.expectRevert("not whitelisted");
      } else if (numMinted[accIndex] >= _accLimit) {
        vm.expectRevert("max whitelist mint per account reached");
      } else {
        numMinted[accIndex]++;
      }
      _GachaBuyTicketSystem.buyWL();
    }

    // check that the total minted tokens is correct
    uint256 totalMinted;
    for (uint256 i = 0; i < _numAccounts; i++) {
      totalMinted += numMinted[i];
    }
    uint256 totalMintedData = LibData.get(components, 0, 0, "MINT_NUM_TOTAL");
    assertEq(totalMintedData, totalMinted, "unexpected mint amount");

    // check that the token balances are correct
    uint256 amtSpent;
    uint256 accTokenBal;
    for (uint256 i = 0; i < _numAccounts; i++) {
      account = _accounts[i];
      amtSpent = numMinted[i] * priceWL;
      accTokenBal = _getTokenBal(address(currency20), account.owner);
      assertEq(accTokenBal, (tokenBalInitial - amtSpent) * 1e15, "unexpected token balance");
    }

    // check that the sum of item balances is correct
    uint256 accItemBal;
    for (uint256 i = 0; i < _numAccounts; i++) {
      account = _accounts[i];
      accItemBal = _getItemBal(account.id, GACHA_TICKET_INDEX);
      assertEq(accItemBal, numMinted[i], "unexpected item balance");
    }
  }

  /////////////////
  // PUBLIC TESTS

  // ensure public mints are not accessible prior to start time
  function testPublicStart(uint256 _currTs, uint32 _startDelta, bool _flip) public {
    vm.assume(_currTs < 1 << 254); // healthy bounds to prevent overflow
    vm.assume(_currTs > 1 << 32); // healthy bounds to prevent underflow

    // set up alice for success
    _mintERC20(address(currency20), pricePublic, alice.owner);

    // shift current and start time
    uint256 startTime = _currTs;
    if (_flip) startTime -= _startDelta;
    else startTime += _startDelta;
    _setConfig("MINT_START_PUBLIC", startTime);
    _setTime(_currTs);

    // attempt to mint
    vm.prank(alice.owner);
    if (_startDelta > 0 && !_flip) vm.expectRevert("public mint has not yet started");
    _GachaBuyTicketSystem.buyPublic(1);
  }

  // test that the Public mint limit is enforced and state is updated correctly
  function testPublicSolo(uint8 limit, uint8 _numMints) public {
    vm.assume(_numMints < 16); // keep it reasonable
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
    uint256 toMint = 0; // quantity to mint in an iteration
    vm.startPrank(alice.owner);
    for (uint256 i = 0; i < _numMints; i++) {
      toMint = uint256(keccak256(abi.encodePacked(limit, _numMints, i))) % 10;
      if (toMint == 0) vm.expectRevert("cannot mint 0 tickets");
      else if (numMinted + toMint > limit) vm.expectRevert("max public mint per account reached");
      else numMinted += toMint;
      _GachaBuyTicketSystem.buyPublic(toMint);
    }

    // check final state
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

  /**
   *  test public minting with multiple accounts and configurations.
   *  NOTE: current configurations don't actually reach/test max mints
   *  @param _numAccounts number of accounts participating in the mint
   *  @param _accLimit maximum number of public mints per account
   *  @param _numMints number of mint iterations
   */
  function testPublicMulti(uint8 _numAccounts, uint8 _accLimit, uint8 _numMints) public {
    vm.assume(_numAccounts < 10 && _numAccounts > 0); // stay within our test setup total accounts
    vm.assume(_accLimit < 100 && _accLimit > 3); // total ticket limit per account
    vm.assume(_numMints < 100 && _numMints > 10); // number of mint iterations

    // useful variables
    uint256 accIndex;
    PlayerAccount storage account;

    // fund all accounts
    uint256 tokenBalInitial = pricePublic * _accLimit;
    for (uint256 i = 0; i < _numAccounts; i++) {
      account = _accounts[i];
      _mintERC20(address(currency20), tokenBalInitial, account.owner);
      _approveERC20(address(currency20), account.owner);
    }

    // configure mint
    _setConfig("MINT_MAX_PUBLIC", _accLimit);
    _setConfig("MINT_START_PUBLIC", _getTime());
    _fastForward(1000);

    // attempt mints
    uint256 numToMint;
    uint256 totalMinted;
    uint256[] memory numMinted = new uint256[](_numAccounts);
    for (uint256 i = 0; i < _numMints; i++) {
      // pick a random sum to mint and a random account
      numToMint = (uint256(keccak256(abi.encodePacked(_numMints, totalMinted))) % _accLimit) + 1;
      accIndex = uint256(keccak256(abi.encodePacked(_numMints, totalMinted))) % _numAccounts;
      account = _accounts[accIndex];

      // mint
      vm.prank(account.owner);
      if (totalMinted + numToMint > maxMints) {
        vm.expectRevert("max mints reached");
      } else if (numMinted[accIndex] + numToMint > _accLimit) {
        vm.expectRevert("max public mint per account reached");
      } else {
        numMinted[accIndex] += numToMint;
        totalMinted += numToMint;
        _numMints++;
      }
      _GachaBuyTicketSystem.buyPublic(numToMint);
    }

    // check that the total minted tokens is correct
    uint256 totalMintedData = LibData.get(components, 0, 0, "MINT_NUM_TOTAL");
    assertEq(totalMintedData, totalMinted, "unexpected mint amount");

    // check that the sum of token balances is correct
    uint256 amtSpent;
    uint256 accTokenBal;
    for (uint256 i = 0; i < _numAccounts; i++) {
      account = _accounts[i];
      amtSpent = numMinted[i] * pricePublic;
      accTokenBal = _getTokenBal(address(currency20), account.owner);
      assertEq(accTokenBal, (tokenBalInitial - amtSpent) * 1e15, "unexpected token balance");
    }

    // check that the sum of item balances is correct
    uint256 accItemBal;
    for (uint256 i = 0; i < _numAccounts; i++) {
      account = _accounts[i];
      accItemBal = _getItemBal(account.id, GACHA_TICKET_INDEX);
      assertEq(accItemBal, numMinted[i], "unexpected item balance");
    }
  }

  /////////////////
  // COMBINED TESTS

  // functional test of more realistic scenario combining whitelist and public mints
  // no data checking, just testing that max constraints are met
  function testMaxMints(uint32 seed) public {
    uint256 _maxMints = 1000;
    uint256 _publicLimit = 5;
    uint256 _numAccounts = 300;
    uint256 _numMints = 500;

    _createOwnerOperatorPairs(_numAccounts);
    _registerAccounts(_numAccounts);

    // useful variables
    uint256 accIndex;
    PlayerAccount storage account;

    // configure mint
    _setConfig("MINT_MAX_TOTAL", _maxMints);
    _setConfig("MINT_MAX_PUBLIC", _publicLimit);
    _setConfig("MINT_MAX_WL", 1);
    _setConfig("MINT_START_PUBLIC", _getTime());
    _setConfig("MINT_START_WL", _getTime());
    _fastForward(1000);

    // fund all accounts and whitelist a third
    uint256 tokenBalInitial = pricePublic * _publicLimit + priceWL;
    for (uint256 i = 0; i < _numAccounts; i++) {
      account = _accounts[i];
      _mintERC20(address(currency20), tokenBalInitial, account.owner);
      _approveERC20(address(currency20), account.owner);
      if (i % 3 == 0) _setFlag(account.id, "MINT_WHITELISTED", true);
    }

    // attempt mints
    uint256 numToMint;
    uint256 totalMinted;
    uint256[] memory numMinted = new uint256[](_numAccounts);
    for (uint256 i = 0; i < _numMints; i++) {
      accIndex = uint256(keccak256(abi.encodePacked(seed, i))) % _numAccounts;
      account = _accounts[accIndex];

      // mint
      vm.prank(account.owner);
      if (seed % 3 == 0) {
        numToMint = 1;
        if (totalMinted + numToMint > maxMints) {
          vm.expectRevert("max mints reached");
        } else if (accIndex % 3 != 0) {
          vm.expectRevert("not whitelisted");
        } else if (numMinted[accIndex] + numToMint > 1) {
          vm.expectRevert("max whitelist mint per account reached");
        } else {
          numMinted[accIndex] += numToMint;
          totalMinted += numToMint;
        }
        _GachaBuyTicketSystem.buyWL();
      } else {
        numToMint = (uint256(keccak256(abi.encodePacked(seed, i))) % _publicLimit) + 1;
        if (totalMinted + numToMint > maxMints) {
          vm.expectRevert("max mints reached");
        } else if (numMinted[accIndex] + numToMint > _publicLimit) {
          vm.expectRevert("max public mint per account reached");
        } else {
          numMinted[accIndex] += numToMint;
          totalMinted += numToMint;
        }
        _GachaBuyTicketSystem.buyPublic(numToMint);
      }
    }
  }
}
