// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./TestSetupImports.sol";

import { Deploy } from "test/Deploy.sol";
import "std-contracts/test/MudTest.t.sol";

abstract contract SetupTemplate is TestSetupImports {
  uint256 petOneEntityID;
  uint256 petTwoEntityID;
  uint256 petThreeEntityID;

  constructor() MudTest(new Deploy()) {}

  function setUp() public virtual override {
    super.setUp();

    // temp: remove later
    // _ERC721PetSystem.init();

    vm.startPrank(deployer);
    __InitSystem.executeTyped();
    _PetMetadataSystem._setRevealed(
      123,
      "https://kamigotchi.nyc3.cdn.digitaloceanspaces.com/images%2F"
    );
    uint256[] memory maxElements = new uint256[](5);
    // maxElements[0] = 9;
    // maxElements[1] = 1;
    // maxElements[2] = 7;
    // maxElements[3] = 8;
    // maxElements[4] = 1;
    maxElements[0] = 2; // BODY
    maxElements[1] = 1; // COLOR
    maxElements[2] = 2; // FACE
    maxElements[3] = 2; // HAND
    maxElements[4] = 1; // BACKGROUND
    _PetMetadataSystem._setMaxElements(maxElements);
    vm.stopPrank();
  }

  /***********************
   *   minting pets
   ************************/

  function _mintPets(uint256 n) internal virtual {
    require(n <= 3, "MUDTest: max three non-admin test accounts");
    if (n > 0) petOneEntityID = _mintSinglePet(alice);
    if (n > 1) petTwoEntityID = _mintSinglePet(bob);
    if (n > 2) petThreeEntityID = _mintSinglePet(eve);
  }

  function _mintSinglePet(address addy) internal virtual returns (uint256 entityID) {
    vm.startPrank(addy, addy);
    entityID = _ERC721PetSystem.mint(addy);
    _PetMetadataSystem.executeTyped(LibPet.idToIndex(components, entityID));
    vm.stopPrank();
  }

  function _transferPetNFT(address from, address to, uint256 nftID) internal {
    vm.prank(from);
    _ERC721PetSystem.transferFrom(from, to, nftID);
  }

  /***********************
   *   room create
   ************************/
  function _roomCreate(string memory name, uint256 location, uint256[] memory exits) internal {
    vm.prank(deployer);
    __RoomCreateSystem.executeTyped(name, location, exits);
  }
}
