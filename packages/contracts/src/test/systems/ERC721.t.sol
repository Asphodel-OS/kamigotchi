// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract ERC721PetTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function _assertOwnerInGame(uint256 tokenID, address addy) internal {
    // owner and component must be the same
    uint256 entityID = LibPet.indexToID(components, tokenID);
    assertEq(
      _KamiERC721.ownerOf(tokenID),
      address(uint160((LibAccount.getOwner(components, LibPet.getAccount(components, entityID)))))
    );
    assertEq(_KamiERC721.ownerOf(tokenID), addy);
  }

  function _assertOwnerOutGame(uint256 tokenID, address addy) internal {
    assertEq(_KamiERC721.ownerOf(tokenID), addy);
  }

  function _assertPetState(uint256 entityID, string memory state) internal {
    assertEq(LibPet.getState(components, entityID), state);
  }

  function testMintSingle() public {
    _mintPets(1);
    _assertOwnerInGame(1, alice);
  }

  function testMintMultiple() public {
    _mintSinglePet(alice);
    _mintSinglePet(alice);
    _mintSinglePet(alice);

    _assertOwnerInGame(1, alice);
    _assertOwnerInGame(2, alice);
    _assertOwnerInGame(3, alice);
  }

  function testStates() public {
    // minting
    vm.startPrank(alice);
    uint256 petID = abi.decode(_ERC721MintSystem.executeTyped(alice), (uint256));
    _assertPetState(petID, "UNREVEALED");

    // revealing
    // vm.prank(alice);
    _ERC721MetadataSystem.executeTyped(LibPet.idToIndex(components, petID));
    _assertPetState(petID, "RESTING");

    // bridging out
    // vm.prank(alice);
    _ERC721WithdrawSystem.executeTyped(LibPet.idToIndex(components, petID));
    _assertPetState(petID, "721_EXTERNAL");

    // bridiging in
    // vm.prank(alice);
    _ERC721DepositSystem.executeTyped(LibPet.idToIndex(components, petID));
    _assertPetState(petID, "RESTING");
  }

  function testFailTransferInGame() public {
    _mintPets(1);

    vm.prank(alice);
    _KamiERC721.transferFrom(alice, bob, 1);
  }

  function testTransferOutOfGame() public {
    _mintPets(1);

    vm.prank(alice);
    _ERC721WithdrawSystem.executeTyped(1);

    vm.prank(alice);
    _KamiERC721.transferFrom(alice, bob, 1);
    _assertOwnerOutGame(1, bob);
  }
}
