// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract ERC721PetTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
    _initCommonTraits();
    _registerAccount(0);
    _registerAccount(1);
  }

  function _assertOwnerInGame(uint256 tokenID, address addr) internal {
    /*
      1) Account owner is EOA, Token owner is Pet721
      2) State is not 721_EXTERNAL (LibPet.isInWorld)
      3) Has an owner (checked implicitly in 1)
    */
    uint256 entityID = LibPet.indexToID(components, tokenID);
    assertEq(
      addr,
      address(uint160((LibAccount.getOwner(components, LibPet.getAccount(components, entityID)))))
    );
    assertEq(_Pet721.ownerOf(tokenID), address(_Pet721));
    assertTrue(LibPet.isInWorld(components, entityID));
  }

  function _assertOwnerOutGame(uint256 tokenID, address addr) internal {
    /*
      1) Owned by addr
      2) State is  721_EXTERNAL (LibPet.isInWorld)
      3) Has no Account
    */
    uint256 entityID = LibPet.indexToID(components, tokenID);
    assertEq(_Pet721.ownerOf(tokenID), addr);
    assertEq(LibPet.getAccount(components, entityID), 0);
    assertTrue(!LibPet.isInWorld(components, entityID));
  }

  // assert a pet's state by its (Entity) ID
  function _assertPetState(uint256 id, string memory state) internal {
    assertEq(LibPet.getState(components, id), state);
  }

  function testStates() public {
    // minting
    _mintMint20(0, 1);
    vm.prank(_getOwner(0));
    uint256 petID = abi.decode(_Pet721MintSystem.executeTyped(1), (uint256[]))[0];
    _assertPetState(petID, "UNREVEALED");

    uint256 petIndex = LibPet.idToIndex(components, petID);
    vm.roll(block.number + 1);

    // revealing
    vm.prank(_getOperator(0));
    _Pet721RevealSystem.executeTyped(petIndex);
    _assertPetState(petID, "RESTING");

    // bridging out
    vm.prank(_getOwner(0));
    _Pet721UnstakeSystem.executeTyped(petIndex);
    _assertPetState(petID, "721_EXTERNAL");

    // bridging in
    vm.prank(_getOwner(0));
    _Pet721StakeSystem.executeTyped(petIndex);
    _assertPetState(petID, "RESTING");
  }

  function testFailTransferInGame() public {
    _mintPet(0);

    vm.prank(_getOwner(0));
    _Pet721.transferFrom(_getOwner(0), _getOwner(1), 1);
  }

  function testTransferOutOfGame() public {
    _mintPet(0);

    vm.prank(_getOwner(0));
    _Pet721UnstakeSystem.executeTyped(1);

    vm.prank(_getOwner(0));
    _Pet721.transferFrom(_getOwner(0), _getOwner(1), 1);
    _assertOwnerOutGame(1, _getOwner(1));
  }

  function testForceReveal() public {
    _mintMint20(0, 1);
    vm.prank(_getOwner(0));
    uint256 petID = abi.decode(_Pet721MintSystem.executeTyped(1), (uint256[]))[0];

    vm.roll(block.number + 256);
    _assertPetState(petID, "UNREVEALED");

    // do something to mine the block
    _mintMint20(0, 1);
    // vm.prank(_getOwner(0));
    // _Pet721MintSystem.executeTyped(1);

    vm.roll(block.number + 1);
    vm.startPrank(deployer);
    _Pet721RevealSystem.forceReveal(LibPet.idToIndex(components, petID));
    vm.stopPrank();

    _assertPetState(petID, "RESTING");
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
