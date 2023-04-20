// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";
// import "forge-std/console.sol";

import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { LibRandom } from "libraries/LibRandom.sol";
import { LibTrait } from "libraries/LibTrait.sol";
import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";
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

  // sets metadata with a random seed
  // second phase of commit/reveal scheme. pet owners call directly
  function execute(bytes memory arguments) public returns (bytes memory) {
    // checks
    require(_revealed, "collection not yet revealed");
    uint256 petIndex = abi.decode(arguments, (uint256));
    uint256 petID = LibPet.indexToID(components, petIndex);

    uint256 accountID = LibAccount.getByAddress(components, msg.sender);
    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");

    MediaURIComponent mediaComp = MediaURIComponent(getAddressById(components, MediaURICompID));

    if (!LibPet.isUnrevealed(components, petID)) revert LibPet.petIsRevealed();

    // generates array of traits with weighted random
    uint256[] memory traits = new uint256[](_numElements);
    // scoping is used to save memory while execution
    {
      // color
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getColorRarities(
        components
      );
      traits[4] = LibRandom.selectFromWeighted(
        keys,
        weights,
        uint256(keccak256(abi.encode(_seed, petID, "Color")))
      );
    }
    {
      // background
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getBackgroundRarities(
        components
      );
      traits[3] = LibRandom.selectFromWeighted(
        keys,
        weights,
        uint256(keccak256(abi.encode(_seed, petID, "Background")))
      );
    }
    {
      // body
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getBodyRarities(
        components
      );
      traits[2] = LibRandom.selectFromWeighted(
        keys,
        weights,
        uint256(keccak256(abi.encode(_seed, petID, "Body")))
      );
    }
    {
      // hand
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getHandRarities(
        components
      );
      traits[1] = LibRandom.selectFromWeighted(
        keys,
        weights,
        uint256(keccak256(abi.encode(_seed, petID, "Hand")))
      );
    }
    {
      // face
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getFaceRarities(
        components
      );
      traits[0] = LibRandom.selectFromWeighted(
        keys,
        weights,
        uint256(keccak256(abi.encode(_seed, petID, "Face")))
      );
    }

    // assigning initial traits from generated stats
    LibTrait.assignColor(components, petID, traits[4]);
    LibTrait.assignBackground(components, petID, traits[3]);
    LibTrait.assignBody(components, petID, traits[2]);
    LibTrait.assignHand(components, petID, traits[1]);
    LibTrait.assignFace(components, petID, traits[0]);

    // set media uri with the packed attributes key
    uint256 packed = LibRandom.packArray(traits, 8);
    mediaComp.set(
      petID,
      // LibString.concat(_baseURI, LibString.concat(LibString.toString(packed), ".gif"))
      LibString.concat(_baseURI, LibString.toString(packed))
    );

    LibPet.reveal(components, petID);
    return "";
  }

  // accepts erc721 petIndex as input
  function executeTyped(uint256 petIndex) public returns (bytes memory) {
    return execute(abi.encode(petIndex));
  }

  /*********************
   *  METADATA ASSEMBLER
   **********************/

  function tokenURI(uint256 petIndex) public view returns (string memory) {
    uint256 petID = LibPet.indexToID(components, petIndex);
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

  function _getHealth(uint256 petID) public view returns (string memory) {
    return
      string(
        abi.encodePacked(
          '{"trait_type": "',
          "Battery Health",
          '", "value": "',
          LibString.toString(LibStat.getHealth(components, petID)),
          '"},\n'
        )
      );
  }

  function _getBaseTraits(uint256 petID) public view returns (string memory) {
    string memory result = "";

    // getting values of base traits. values are hardcoded to array position
    string[] memory comps = new string[](5);
    comps[0] = "Body";
    comps[1] = "Color";
    comps[2] = "Face";
    comps[3] = "Hand";
    comps[4] = "Background";

    string[] memory names = new string[](5);
    names[0] = LibTrait.getBodyName(components, petID);
    names[1] = LibTrait.getColorName(components, petID);
    names[2] = LibTrait.getFaceName(components, petID);
    names[3] = LibTrait.getHandName(components, petID);
    names[4] = LibTrait.getBackgroundName(components, petID);

    for (uint256 i; i < names.length; i++) {
      string memory entry = string(
        abi.encodePacked('{"trait_type": "', comps[i], '", "value": "', names[i], '"},\n')
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
    _maxElements = LibRandom.packArray(max, 8);
  }

  // sets a seed. maybe VRF in future
  // TODO: update this to a more appropriate name
  function _setRevealed(uint256 seed, string memory baseURI) public onlyOwner {
    require(!_revealed, "already revealed");
    _seed = seed;
    _baseURI = baseURI;
    _revealed = true;
  }
}
