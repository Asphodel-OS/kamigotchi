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
  function setUp() public override {
    super.setUp();

    _setConfig("MINT_PRICE", 1e18);
    _registerAccount(0);
    _registerAccount(1);
    _registerAccount(2);

    _initTraits();
  }
}
