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

contract ERC721MintTest is SetupTemplate {
  uint256 constant mintPrice = 1e18;

  function setUp() public override {
    super.setUp();

    _setConfig("MINT_PRICE", mintPrice);
    _registerAccount(0);
    _registerAccount(1);
    _registerAccount(2);

    _initCommonTraits();
  }

  //////////////////////////
  // HELPERS

  function _assertOwnerInGame(uint256 tokenID, address addr) internal {
    /*
      1) Account owner is EOA, Token owner is KamiERC721
      2) State is not 721_EXTERNAL (LibPet.isInWorld)
      3) Has an owner (checked implicitly in 1)
    */
    uint256 entityID = LibPet.indexToID(components, tokenID);
    assertEq(
      addr,
      address(uint160((LibAccount.getOwner(components, LibPet.getAccount(components, entityID)))))
    );
    assertEq(_KamiERC721.ownerOf(tokenID), address(_KamiERC721));
    assertTrue(LibPet.isInWorld(components, entityID));
  }

  function _assertOwnerOutGame(uint256 tokenID, address addr) internal {
    /*
      1) Owned by addr
      2) State is  721_EXTERNAL (LibPet.isInWorld)
      3) Has no Account
    */
    uint256 entityID = LibPet.indexToID(components, tokenID);
    assertEq(_KamiERC721.ownerOf(tokenID), addr);
    assertEq(LibPet.getAccount(components, entityID), 0);
    assertTrue(!LibPet.isInWorld(components, entityID));
  }

  //////////////////////////
  // TESTS

  function testMintSingle() public {
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

  // depreciated - limits on mint20 instead
  // function testFailMaxMintSeparateTx() public {
  //   for (uint256 i = 0; i < 501; i++) {
  //     _mintPet(0);
  //   }
  // }

  // function testFailMaxMintSingleTx() public {
  //   vm.prank(alice);
  //   _ERC721MintSystem.executeTyped(501);
  // }
}
