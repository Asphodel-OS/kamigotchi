// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract ERC721PetTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
    _initTraits();
    _registerAccount(alice, alice);
    _registerAccount(bob, bob);
    _registerAccount(eve, eve);
  }

  function _assertOwnerInGame(uint256 tokenID, address addy) internal {
    /*
      1) Account owner is EOA, Token owner is KamiERC721
      2) State is not 721_EXTERNAL (LibPet.isInWorld)
      3) Has an owner (checked implicitly in 1)
    */
    uint256 entityID = LibPet.indexToID(components, tokenID);
    assertEq(
      addy,
      address(uint160((LibAccount.getOwner(components, LibPet.getAccount(components, entityID)))))
    );
    assertEq(_KamiERC721.ownerOf(tokenID), address(_KamiERC721));
    assertTrue(LibPet.isInWorld(components, entityID));
  }

  function _assertOwnerOutGame(uint256 tokenID, address addy) internal {
    /*
      1) Owned by addy
      2) State is  721_EXTERNAL (LibPet.isInWorld)
      3) Has no Account
    */
    uint256 entityID = LibPet.indexToID(components, tokenID);
    assertEq(_KamiERC721.ownerOf(tokenID), addy);
    assertEq(LibPet.getAccount(components, entityID), 0);
    assertTrue(!LibPet.isInWorld(components, entityID));
  }

  function _assertPetState(uint256 entityID, string memory state) internal {
    assertEq(LibPet.getState(components, entityID), state);
  }

  function testMintSingle() public {
    _mintPets(alice, 1);
    _assertOwnerInGame(1, alice);
  }

  function testMintMultiple() public {
    _mintPet(alice);
    _mintPet(alice);
    _mintPet(alice);

    _assertOwnerInGame(1, alice);
    _assertOwnerInGame(2, alice);
    _assertOwnerInGame(3, alice);
  }

  function testStates() public {
    // minting
    vm.startPrank(alice);
    uint256 petID = abi.decode(_ERC721MintSystem.whitelistMint(), (uint256[]))[0];
    vm.roll(block.number + 1);
    _assertPetState(petID, "UNREVEALED");

    // revealing
    // vm.prank(alice);
    _ERC721RevealSystem.executeTyped(LibPet.idToIndex(components, petID));
    _assertPetState(petID, "RESTING");

    // bridging out
    // vm.prank(alice);
    _ERC721UnstakeSystem.executeTyped(LibPet.idToIndex(components, petID));
    _assertPetState(petID, "721_EXTERNAL");

    // bridiging in
    // vm.prank(alice);
    _ERC721StakeSystem.executeTyped(LibPet.idToIndex(components, petID));
    _assertPetState(petID, "RESTING");
  }

  function testFailTransferInGame() public {
    _mintPets(alice, 1);

    vm.prank(alice);
    _KamiERC721.transferFrom(alice, bob, 1);
  }

  function testTransferOutOfGame() public {
    _mintPets(alice, 1);

    vm.prank(alice);
    _ERC721UnstakeSystem.executeTyped(1);

    vm.prank(alice);
    _KamiERC721.transferFrom(alice, bob, 1);
    _assertOwnerOutGame(1, bob);
  }

  function testForceReveal() public {
    vm.prank(alice);
    uint256 petID = abi.decode(_ERC721MintSystem.whitelistMint(), (uint256[]))[0];

    vm.roll(block.number + 256);
    _assertPetState(petID, "UNREVEALED");

    // do something to mine the block
    vm.prank(alice);
    _ERC721MintSystem.whitelistMint();

    vm.roll(block.number + 1);
    vm.startPrank(deployer);
    _ERC721RevealSystem.forceReveal(LibPet.idToIndex(components, petID));
    vm.stopPrank();

    _assertPetState(petID, "RESTING");
  }

  function testFailMaxMintSeparateTx() public {
    for (uint256 i = 0; i < 501; i++) {
      _mintPet(alice);
    }
  }

  function testFailMaxMintSingleTx() public {
    vm.prank(alice);
    _ERC721MintSystem.executeTyped(501);
  }

  // does not actually check if metadata is accurate, only if syntax is valid
  function testMetadata() public {
    _mintPets(alice, 1);

    // console.log(LibPet.getMediaURI(components, LibPet.indexToID(components, 1)));
  }

  // only prints mediaURI, does not check if it is accurate
  function testMediaURI() public {
    _mintPets(1);

    console.log(LibPet.getMediaURI(components, LibPet.indexToID(components, 1)));
  }
}
