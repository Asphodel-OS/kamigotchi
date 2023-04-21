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
}
