// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

// Things we want to test for Mint (probably through a dedicated test)
// - whitelist minting (only one allowed)
// - single paid minting (multiple times over)
// - batch paid minting (multiple times over)
//
// For each of the above cases we want to test
// - proper account allocation of kami
// - proper detraction of funds
// - proper respect for minting limits
//
// We'll also want to check for proper kami initial values
// - IsPetComponent
// - IndexPetComponent
// - setAccount
// - setMediaURI
// - setState
// - setExperience
//
// Best not to rely on SetupTemplate Functions for this. There, we'll want to
// enable free mints (through config) for ease of use in testing.

contract Pet721MintTest is SetupTemplate {
  uint constant mintPrice = 1e18;

  function setUp() public override {
    super.setUp();

    _setConfig("MINT_PRICE", mintPrice);
    _setConfig("ACCOUNT_STAMINA_BASE", 1e9);

    _createRoom("testRoom1", 1, 4, 0, 0);
    _createRoom("testRoom4", 4, 1, 0, 0);

    _registerAccount(0);
    _registerAccount(1);
    _registerAccount(2);

    _initCommonTraits();
  }

  //////////////////////////
  // HELPERS

  function _assertOwnerInGame(uint tokenID, address addr) internal {
    /*
      1) Account owner is EOA, Token owner is Pet721
      2) State is not 721_EXTERNAL (LibPet.isInWorld)
      3) Has an owner (checked implicitly in 1)
    */
    uint entityID = LibPet.indexToID(components, tokenID);
    assertEq(
      addr,
      address(uint160((LibAccount.getOwner(components, LibPet.getAccount(components, entityID)))))
    );
    assertEq(_Pet721.ownerOf(tokenID), address(_Pet721));
    assertTrue(LibPet.isInWorld(components, entityID));
  }

  function _assertOwnerOutGame(uint tokenID, address addr) internal {
    /*
      1) Owned by addr
      2) State is  721_EXTERNAL (LibPet.isInWorld)
      3) Has no Account
    */
    uint entityID = LibPet.indexToID(components, tokenID);
    assertEq(_Pet721.ownerOf(tokenID), addr);
    assertEq(LibPet.getAccount(components, entityID), 0);
    assertTrue(!LibPet.isInWorld(components, entityID));
  }

  // converts ERC20 decimals (18) to game decimals (0)
  function _tokenToGameDP(uint amount) internal pure returns (uint) {
    return amount / 10 ** 18;
  }

  // converts game decimals (0) to ERC20 decimals (18)
  function _gameToTokenDP(uint amount) internal pure returns (uint) {
    return amount * 10 ** 18;
  }

  //////////////////////////
  // TESTS

  function testMintProcess(uint num20, uint num721) public {
    vm.assume(num20 < ((~uint(0)) / 1e18));
    vm.assume(num721 < ((~uint(0)) / 1e18));

    address owner = _getOwner(0);

    uint supplyLimit = LibConfig.getValueOf(components, "MINT_TOTAL_MAX");
    if (supplyLimit < num20) {
      vm.prank(deployer);
      vm.expectRevert("Mint20: totalMinted exceeded");
      _Mint20.adminMint(owner, num20);
      return;
    } else {
      _giveMint20(0, num20);
    }

    _moveAccount(0, 4); // minting restricted to room 4

    if (num721 == 0) {
      vm.prank(owner);
      vm.expectRevert("Pet721Mint: must be > 0");
      _Pet721MintSystem.executeTyped(num721);
      return;
    } else if (num20 < num721) {
      vm.prank(owner);
      // evm underflows on this revert
      vm.expectRevert();
      _Pet721MintSystem.executeTyped(num721);
    } else {
      vm.prank(owner);
      _Pet721MintSystem.executeTyped(num721);

      assertEq(_tokenToGameDP(_Mint20.balanceOf(owner)), num20 - num721);
      assertEq(_Pet721.balanceOf(address(_Pet721)), num721); // minted in game
    }
  }

  function testMintSingleGeneric() public {
    _mintPet(0);
    _assertOwnerInGame(1, _getOwner(0));
  }

  function testMintMultiple() public {
    _mintPet(0);
    _mintPet(0);
    _mintPet(0);

    _assertOwnerInGame(1, _getOwner(0));
    _assertOwnerInGame(2, _getOwner(0));
    _assertOwnerInGame(3, _getOwner(0));
  }

  function testInsufficentBalance() public {
    vm.prank(_getOwner(0));
    // evm underflows on this revert
    vm.expectRevert();
    _Pet721MintSystem.executeTyped(1);
  }
}
