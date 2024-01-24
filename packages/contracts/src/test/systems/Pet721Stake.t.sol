// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

contract Pet721StakeTest is SetupTemplate {
  function setUp() public override {
    super.setUp();
  }

  function setUpRooms() public override {
    _createRoom("testRoom1", 1, 4, 12, 0);
    _createRoom("testRoom4", 4, 1, 12, 0);
    _createRoom("testRoom12", 12, 1, 4, 0);
  }

  ////////////
  //  TESTS //
  ////////////

  function testStates() public {
    // minting
    uint256 petID = _mintPet(0);
    uint256 petIndex = LibPet.idToIndex(components, petID);
    _assertPetState(petID, "RESTING");

    _moveAccount(0, 12); // bridging restricted to room 12

    // bridging out
    vm.prank(_getOwner(0));
    _Pet721UnstakeSystem.executeTyped(petIndex);
    _assertPetState(petID, "721_EXTERNAL");

    // bridging in
    vm.prank(_getOwner(0));
    _Pet721StakeSystem.executeTyped(petIndex);
    _assertPetState(petID, "RESTING");
  }

  function testTransferOutOfGame() public {
    uint256 petID = _mintPet(0);
    uint256 petIndex = LibPet.idToIndex(components, petID);
    _moveAccount(0, 12); // bridging restricted to room 12

    vm.prank(_getOwner(0));
    _Pet721UnstakeSystem.executeTyped(petIndex);

    vm.prank(_getOwner(0));
    _Pet721.transferFrom(_getOwner(0), _getOwner(1), petIndex);
    _assertOwnerOutGame(petIndex, _getOwner(1));
  }

  // does not actually check if metadata is accurate, only if syntax is valid
  function testMetadata() public {
    _mintPet(0);

    // console.log(LibPet.getMediaURI(components, LibPet.indexToID(components, 1)));
  }

  // only prints mediaURI, does not check if it is accurate
  function testMediaURI() public {
    _mintPet(0);

    console.log(LibPet.getMediaURI(components, LibPet.indexToID(components, 1)));
  }

  ////////////////
  // ASSERTIONS //
  ////////////////

  // assert a pet's state by its (Entity) ID
  function _assertPetState(uint256 id, string memory state) internal {
    assertEq(LibPet.getState(components, id), state);
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
}
