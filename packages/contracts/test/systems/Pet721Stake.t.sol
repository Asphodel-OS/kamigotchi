// // SPDX-License-Identifier: Unlicense
// pragma solidity >=0.8.28;

// import "tests/utils/SetupTemplate.t.sol";

// contract Kami721StakeTest is SetupTemplate {
//   function setUp() public override {
//     super.setUp();
//   }

//   function setUpRooms() public override {
//     _createRoom("testRoom1", Coord(1, 1, 0), 1, 12);
//     _createRoom("testRoom4", Coord(1, 2, 0), 2);
//     _createRoom("testRoom12", Coord(2, 2, 0), 12, 1);
//   }

//   ////////////
//   //  TESTS //
//   ////////////

//   function testStates() public {
//     // minting
//     uint256 kamiID = _mintKami(0);
//     uint32 petIndex = LibKami.getIndex(components, kamiID);
//     _assertPetState(kamiID, "RESTING");

//     _moveAccount(0, 12); // bridging restricted to room 12

//     // bridging out
//     vm.prank(_getOwner(0));
//     _Kami721UnstakeSystem.executeTyped(petIndex);
//     _assertPetState(kamiID, "721_EXTERNAL");

//     // bridging in
//     vm.prank(_getOwner(0));
//     _Kami721StakeSystem.executeTyped(petIndex);
//     _assertPetState(kamiID, "RESTING");
//   }

//   function testTransferOutOfGame() public {
//     uint256 kamiID = _mintKami(0);
//     uint32 petIndex = LibKami.getIndex(components, kamiID);
//     _moveAccount(0, 12); // bridging restricted to room 12

//     vm.prank(_getOwner(0));
//     _Kami721UnstakeSystem.executeTyped(petIndex);

//     vm.prank(_getOwner(0));
//     _Kami721.transferFrom(_getOwner(0), _getOwner(1), petIndex);
//     _assertOwnerOutGame(petIndex, _getOwner(1));
//   }

//   // does not actually check if metadata is accurate, only if syntax is valid
//   function testMetadata() public {
//     _mintKami(0);

//     // console.log(LibKami.getMediaURI(components, LibKami.getByIndex(components, 1)));
//   }

//   ////////////////
//   // ASSERTIONS //
//   ////////////////

//   // assert a pet's state by its (Entity) ID
//   function _assertPetState(uint256 id, string memory state) internal {
//     assertEq(LibKami.getState(components, id), state);
//   }

//   function _assertOwnerInGame(uint256 tokenID, address addr) internal {
//     /*
//       1) Account owner is EOA, Token owner is Kami721
//       2) State is not 721_EXTERNAL (LibKami.isInWorld)
//       3) Has an owner (checked implicitly in 1)
//     */
//     uint256 entityID = LibKami.getByIndex(components, uint32(tokenID));
//     assertEq(
//       addr,
//       address(uint160((LibAccount.getOwner(components, LibKami.getAccount(components, entityID)))))
//     );
//     assertEq(_Kami721.ownerOf(tokenID), address(_Kami721));
//     assertTrue(LibKami.isInWorld(components, entityID));
//   }

//   function _assertOwnerOutGame(uint256 tokenID, address addr) internal {
//     /*
//       1) Owned by addr
//       2) State is  721_EXTERNAL (LibKami.isInWorld)
//       3) Has no Account
//     */
//     uint256 entityID = LibKami.getByIndex(components, uint32(tokenID));
//     assertEq(_Kami721.ownerOf(tokenID), addr);
//     assertEq(LibKami.getAccount(components, entityID), 0);
//     assertTrue(!LibKami.isInWorld(components, entityID));
//   }
// }
