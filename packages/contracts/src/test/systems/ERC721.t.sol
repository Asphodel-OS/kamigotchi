// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract ERC721PetTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
    _initTraits();
    _registerAccount(0);
    _registerAccount(1);
  }

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

  // assert a pet's state by its (Entity) ID
  function _assertPetState(uint256 id, string memory state) internal {
    assertEq(LibPet.getState(components, id), state);
  }

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

  function testStates() public {
    // minting
    vm.prank(_getOwner(0));
    uint256 petID = abi.decode(_ERC721MintSystem.whitelistMint(), (uint256[]))[0];
    _assertPetState(petID, "UNREVEALED");

    uint256 petIndex = LibPet.idToIndex(components, petID);
    vm.roll(block.number + 1);

    // revealing
    vm.prank(_getOperator(0));
    _ERC721RevealSystem.executeTyped(petIndex);
    _assertPetState(petID, "RESTING");

    // bridging out
    vm.prank(_getOwner(0));
    _ERC721UnstakeSystem.executeTyped(petIndex);
    _assertPetState(petID, "721_EXTERNAL");

    // bridging in
    vm.prank(_getOwner(0));
    _ERC721StakeSystem.executeTyped(petIndex);
    _assertPetState(petID, "RESTING");
  }

  function testFailTransferInGame() public {
    _mintPet(0);

    vm.prank(_getOwner(0));
    _KamiERC721.transferFrom(_getOwner(0), _getOwner(1), 1);
  }

  function testTransferOutOfGame() public {
    _mintPet(0);

    vm.prank(_getOwner(0));
    _ERC721UnstakeSystem.executeTyped(1);

    vm.prank(_getOwner(0));
    _KamiERC721.transferFrom(_getOwner(0), _getOwner(1), 1);
    _assertOwnerOutGame(1, _getOwner(1));
  }

  function testForceReveal() public {
    vm.prank(_getOwner(0));
    uint256 petID = abi.decode(_ERC721MintSystem.whitelistMint(), (uint256[]))[0];

    vm.roll(block.number + 256);
    _assertPetState(petID, "UNREVEALED");

    // do something to mine the block
    vm.prank(_getOwner(0));
    _ERC721MintSystem.whitelistMint();

    vm.roll(block.number + 1);
    vm.startPrank(deployer);
    _ERC721RevealSystem.forceReveal(LibPet.idToIndex(components, petID));
    vm.stopPrank();

    _assertPetState(petID, "RESTING");
  }

  function testFailMaxMintSeparateTx() public {
    for (uint256 i = 0; i < 501; i++) {
      _mintPet(0);
    }
  }

  function testFailMaxMintSingleTx() public {
    vm.prank(alice);
    _ERC721MintSystem.executeTyped(501);
  }

  // does not actually check if metadata is accurate, only if syntax is valid
  function testMetadata() public {
    _mintPet(0);

    // console.log(LibPet.getMediaURI(components, LibPet.indexToID(components, 1)));
  }

  // only prints mediaURI, does not check if it is accurate
  function testMediaURI() public {
    _mintPets(0, 1);

    console.log(LibPet.getMediaURI(components, LibPet.indexToID(components, 1)));
  }
}
