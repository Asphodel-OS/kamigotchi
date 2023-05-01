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

    _initMetadata();
    _initTraits();
  }

  /***********************
   *   minting pets
   ************************/

  // mints and reveals
  function _mintPets(uint256 n) internal virtual {
    require(n <= 3, "MUDTest: max three non-admin test accounts");
    if (n > 0) petOneEntityID = _mintSinglePet(alice);
    if (n > 1) petTwoEntityID = _mintSinglePet(bob);
    if (n > 2) petThreeEntityID = _mintSinglePet(eve);
  }

  function _mintSinglePet(address addy) internal virtual returns (uint256 entityID) {
    vm.startPrank(addy, addy);
    entityID = abi.decode(_ERC721MintSystem.executeTyped(addy), (uint256));
    vm.roll(block.number + 1);
    _ERC721MetadataSystem.executeTyped(LibPet.idToIndex(components, entityID));
    vm.stopPrank();
  }

  /***********************
   *   room create
   ************************/
  function _roomCreate(string memory name, uint256 location, uint256[] memory exits) internal {
    vm.prank(deployer);
    __RoomCreateSystem.executeTyped(name, location, exits);
  }

  /***********************
   *   accounts
   ************************/
  function _createAccount(address addy, string memory name) internal {
    vm.prank(addy);
    _AccountSetSystem.executeTyped(addy, name);
  }

  /***********************
   *   inits
   ************************/
  function _initMetadata() internal {
    vm.startPrank(deployer);
    _ERC721MetadataSystem._setBaseURI("baseURI.com/");
    vm.stopPrank();
  }

  // creates bare minimum traits (1 of each)
  // PLACEHOLDER
  function _initTraits() internal {
    vm.startPrank(deployer);
    __RegistryCreateTraitSystem.executeTyped(
      1, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity
      "INSECT", // affinity
      "NAME", // name
      "BODY" // trait type
    );

    __RegistryCreateTraitSystem.executeTyped(
      1, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity
      "INSECT", // affinity
      "NAME", // name
      "BACKGROUND" // trait type
    );

    __RegistryCreateTraitSystem.executeTyped(
      1, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity
      "INSECT", // affinity
      "NAME", // name
      "COLOR" // trait type
    );

    __RegistryCreateTraitSystem.executeTyped(
      1, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity
      "INSECT", // affinity
      "NAME", // name
      "FACE" // trait type
    );

    __RegistryCreateTraitSystem.executeTyped(
      1, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity
      "INSECT", // affinity
      "NAME", // name
      "HAND" // trait type
    );

    vm.stopPrank();
  }
}
