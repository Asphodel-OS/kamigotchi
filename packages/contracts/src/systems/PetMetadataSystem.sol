// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";
// import "forge-std/console.sol";

import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { LibMetadata } from "libraries/LibMetadata.sol";
import { LibModifier, ModStatus } from "libraries/LibModifier.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibStat } from "libraries/LibStat.sol";
import { ERC721PetSystem, UNREVEALED_URI, ID as PetSystemID } from "systems/ERC721PetSystem.sol";

uint256 constant ID = uint256(keccak256("system.ERC721.metadata"));

contract PetMetadataSystem is System {
  uint256 _maxElements;
  uint256 _numElements;
  uint256 _seed;
  bool _revealed;
  string _baseURI;

  constructor(IWorld _world, address _components) System(_world, _components) {}

  /*********************
   *  PET SET PIC
   **********************/

  modifier onlyPetSystem() {
    require(msg.sender == getAddressById(world.systems(), PetSystemID), "not Pet System");
    _;
  }

  // sets metadata with a random seed
  // second phase of commit/reveal scheme. pet owners call directly
  function execute(bytes memory arguments) public returns (bytes memory) {
    // reveals individual metadata
    require(_revealed, "collection not yet revealed");
    uint256 tokenID = abi.decode(arguments, (uint256));
    uint256 entityID = LibPet.indexToID(components, tokenID);

    uint256 accountID = LibAccount.getByAddress(components, msg.sender);
    require(LibPet.getAccount(components, entityID) == accountID, "Pet: not urs");

    MediaURIComponent mediaComp = MediaURIComponent(getAddressById(components, MediaURICompID));

    require(LibString.eq(mediaComp.getValue(entityID), UNREVEALED_URI), "alr revealed!");

    // generate packed result, set image
    uint256 packed = LibMetadata._generateFromSeed(
      uint256(keccak256(abi.encode(_seed, entityID))),
      _maxElements,
      _numElements
    );
    mediaComp.set(
      entityID,
      // LibString.concat(_baseURI, LibString.concat(LibString.toString(packed), ".gif"))
      LibString.concat(_baseURI, LibString.toString(packed))
    );

    uint256[] memory permTraits = LibMetadata._packedToArray(packed, _numElements);
    // assigning initial traits. genus is hardcoded
    string[] memory names = new string[](5);
    names[0] = "BODY";
    names[1] = "COLOR";
    names[2] = "FACE";
    names[3] = "HAND";
    names[4] = "BACKGROUND";
    for (uint256 i; i < permTraits.length; i++) {
      // console.log(names[i]);
      // console.log(permTraits[i]);
      LibModifier.addToPet(
        components,
        world,
        entityID,
        names[i], // genus
        permTraits[i] // index
      );
    }

    return "";
  }

  // accepts erc721 tokenID as input
  function executeTyped(uint256 tokenID) public returns (bytes memory) {
    return execute(abi.encode(tokenID));
  }

  /*********************
   *  METADATA ASSEMBLER
   **********************/

  function tokenURI(uint256 tokenID) public view returns (string memory) {
    uint256 petID = LibPet.indexToID(components, tokenID);
    // return LibPet.getMediaURI(components, petID);
    // return _getBaseTraits(petID);

    return
      string(
        abi.encodePacked(
          "{ \n",
          '"external_url": "https://kamigotchi.io",\n',
          '"name": "',
          LibPet.getName(components, petID),
          '",\n',
          '"description": ',
          '"a lil network spirit :3",\n',
          '"attributes": [\n',
          _getBaseTraits(petID),
          _getHealth(petID),
          "],\n",
          '"image": "',
          LibPet.getMediaURI(components, petID),
          '"\n',
          "}"
        )
      );
  }

  function _getHealth(uint256 entityID) public view returns (string memory) {
    return
      string(
        abi.encodePacked(
          '{"trait_type": "',
          "Battery Health",
          '", "value": "',
          LibString.toString(LibStat.getHealth(components, entityID)),
          '"},\n'
        )
      );
  }

  function _getPetType(uint256 entityID) public view returns (string memory) {
    string[] memory types = LibModifier.getPetTypes(components, entityID);
    return
      string(
        abi.encodePacked(
          '{"trait_type": "',
          "Type",
          '", "value": "',
          types[0],
          " | ",
          types[1],
          '"},\n'
        )
      );
  }

  function _getBaseTraits(uint256 entityID) public view returns (string memory) {
    string memory result = "";

    // getting values of base traits. values are hardcoded to array position
    string[] memory names = new string[](5);
    names[0] = "Body";
    names[1] = "Color";
    names[2] = "Face";
    names[3] = "Hand";
    names[4] = "Background";
    // string[] memory values = LibPetTraits.getNames(
    //   components,
    //   LibPetTraits.getPermArray(components, entityID)
    // );

    for (uint256 i; i < names.length; i++) {
      uint256 curID = LibModifier._getAllX(
        components,
        entityID, // petID
        LibString.toCase(names[i], true), // genus, all caps
        0, // index, can vary
        ModStatus.NULL,
        "", // mod type, not searching
        "" // pet type, not searching
      )[0];
      string memory valName = LibModifier.getName(components, curID);
      string memory entry = string(
        abi.encodePacked('{"trait_type": "', names[i], '", "value": "', valName, '"},\n')
      );

      result = string(abi.encodePacked(result, entry));
    }

    return result;
  }

  /*********************
   *  CONFIG FUNCTIONS
   **********************/

  // set max variables for metadata lib
  function _setMaxElements(uint256[] memory max) public onlyOwner {
    _numElements = max.length;
    _maxElements = LibMetadata._generateMaxElements(max);
  }

  // sets a seed. maybe VRF in future
  function _setRevealed(uint256 seed, string memory baseURI) public onlyOwner {
    require(!_revealed, "already revealed");
    _seed = seed;
    _baseURI = baseURI;
    _revealed = true;
  }
}
