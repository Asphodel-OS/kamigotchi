// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { Base64 } from "solady/utils/Base64.sol";
import { LibString } from "solady/utils/LibString.sol";

import { AffinityComponent, ID as AffinityCompID } from "components/AffinityComponent.sol";
import { IdHolderComponent, ID as IdHolderComponentID } from "components/IdHolderComponent.sol";
import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBgCompID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { RarityComponent, ID as RarityCompID } from "components/RarityComponent.sol";

import { Pet721ProxySystem, ID as ProxyID } from "systems/Pet721ProxySystem.sol";
import { Pet721 } from "tokens/Pet721.sol";

import { LibExperience } from "libraries/LibExperience.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";
import { LibStat } from "libraries/LibStat.sol";
import { LibRandom } from "libraries/LibRandom.sol";

uint256 constant NUM_TRAITS = 5;

// Library for ERC721 interactions and metadata generation functions
library LibPet721 {
  ////////////////////////
  // INTERACTIONS

  // reveals kami
  // returns packed traits
  function reveal(
    IWorld world,
    IUintComp components,
    uint256 petID,
    uint256 seed
  ) internal returns (uint256 packed) {
    // generates array of traits with weighted random
    uint256[] memory traits = genRandTraits(components, petID, seed);

    // setting metadata
    assignTraits(components, petID, traits);

    // emit update event
    updateEvent(world, LibPet.idToIndex(components, petID));

    // returns packed traits
    packed = LibRandom.packArray(traits, 8);
  }

  // minting a new kami in game. the default
  // mints to Pet721 contract as owner
  // does not interact with other mud systems
  function mintInGame(IWorld world, uint256 index) internal {
    Pet721 token = getContract(world);
    token.mint(address(token), index);
  }

  // minting out of game
  // mints directly to EOA
  // does not interact with other mud systems
  function mintOutGame(IWorld world, address to, uint256 index) internal {
    Pet721 token = getContract(world);
    token.mint(to, index);
  }

  // stakes a kami, out of game -> in game
  function stake(IWorld world, address from, uint256 index) internal {
    Pet721 token = getContract(world);
    token.stakeToken(from, index);
  }

  // unstakes a kami, in game -> out of game
  function unstake(IWorld world, address to, uint256 index) internal {
    Pet721 token = getContract(world);
    token.unstakeToken(to, index);
  }

  // emits a metadata update event. to be called whenever metadata changes
  function updateEvent(IWorld world, uint256 index) internal {
    Pet721 token = getContract(world);
    token.emitMetadataUpdate(index);
  }

  /////////////////////////
  // GETTERS

  function getContract(IWorld world) internal view returns (Pet721) {
    return Pet721ProxySystem(getAddressById(world.systems(), ProxyID)).getToken();
  }

  function getEOAOwner(IWorld world, uint256 index) internal view returns (address) {
    return getContract(world).ownerOf(index);
  }

  // gets current supply of kamiERC721
  function getCurrentSupply(IWorld world) internal view returns (uint256) {
    return getContract(world).totalSupply();
  }

  ////////////////////////
  // METADATA GENERATION

  function genRandTraits(
    IUintComp components,
    uint256 petID,
    uint256 seed
  ) internal view returns (uint256[] memory) {
    uint256[] memory traits = new uint256[](NUM_TRAITS);
    // scoping is used to save memory while execution
    {
      // color
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getColorRarities(
        components
      );
      traits[4] = LibRandom.selectFromWeighted(
        keys,
        weights,
        uint256(keccak256(abi.encode(seed, petID, "Color")))
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
        uint256(keccak256(abi.encode(seed, petID, "Background")))
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
        uint256(keccak256(abi.encode(seed, petID, "Body")))
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
        uint256(keccak256(abi.encode(seed, petID, "Hand")))
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
        uint256(keccak256(abi.encode(seed, petID, "Face")))
      );
    }

    return traits;
  }

  // Set the trait indices for a pet
  function assignTraits(IUintComp components, uint256 petID, uint256[] memory traits) internal {
    LibRegistryTrait.setColorIndex(components, petID, traits[4]);
    LibRegistryTrait.setBackgroundIndex(components, petID, traits[3]);
    LibRegistryTrait.setBodyIndex(components, petID, traits[2]);
    LibRegistryTrait.setHandIndex(components, petID, traits[1]);
    LibRegistryTrait.setFaceIndex(components, petID, traits[0]);
  }

  //////////////////
  // JSON STRINGIFY

  // gets json in base64 format
  function getJsonBase64(
    IUintComp components,
    uint256 petIndex
  ) public view returns (string memory) {
    return
      LibString.concat(
        "data:application/json;base64,",
        Base64.encode(abi.encodePacked(getJsonUtf(components, petIndex)), false, false)
      );
  }

  // gets json in UTF-8 format
  function getJsonUtf(IUintComp components, uint256 petIndex) public view returns (string memory) {
    uint256 petID = LibPet.indexToID(components, petIndex);

    return
      string(
        abi.encodePacked(
          "{",
          '"external_url": "https://kamigotchi.io", ',
          '"name": "',
          LibPet.getName(components, petID),
          '", ',
          '"description": ',
          '"a lil network spirit :3", ',
          '"attributes": [',
          _getBaseTraits(components, petID),
          _getStats(components, petID),
          "], ",
          '"image": "',
          LibPet.getMediaURI(components, petID),
          '"',
          "}"
        )
      );
  }

  function _getBaseTraits(
    IUintComp components,
    uint256 petID
  ) internal view returns (string memory) {
    string memory result = "";

    // getting values of base traits. values are hardcoded to array position
    string[] memory comps = new string[](5);
    comps[0] = "Body";
    comps[1] = "Color";
    comps[2] = "Face";
    comps[3] = "Hand";
    comps[4] = "Background";

    string[] memory names = new string[](5);
    names[0] = LibRegistryTrait.getBodyNameOf(components, petID);
    names[1] = LibRegistryTrait.getColorNameOf(components, petID);
    names[2] = LibRegistryTrait.getFaceNameOf(components, petID);
    names[3] = LibRegistryTrait.getHandNameOf(components, petID);
    names[4] = LibRegistryTrait.getBackgroundNameOf(components, petID);

    for (uint256 i; i < names.length; i++) {
      string memory entry = _traitToString(comps[i], names[i], true);
      result = string(abi.encodePacked(result, entry));
    }

    return result;
  }

  function _getStats(IUintComp components, uint256 petID) internal view returns (string memory) {
    string memory result = "";

    // returns result for Health, Power, Violence, and Harmony
    result = string(
      abi.encodePacked(result, _traitToString("Health", LibStat.getHealth(components, petID), true))
    );
    result = string(
      abi.encodePacked(result, _traitToString("Power", LibStat.getPower(components, petID), true))
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString("Violence", LibStat.getViolence(components, petID), true)
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString("Harmony", LibStat.getHarmony(components, petID), true)
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString("Level", LibExperience.getLevel(components, petID), false)
      )
    );

    return result;
  }

  // appends trait and trait type to metadata format
  function _traitToString(
    string memory name,
    string memory value,
    bool comma
  ) internal pure returns (string memory) {
    if (comma) {
      return string(abi.encodePacked('{"trait_type": "', name, '", "value": "', value, '"}, '));
    } else {
      return string(abi.encodePacked('{"trait_type": "', name, '", "value": "', value, '"} '));
    }
  }

  // appends trait and trait type to metadata format, but with a uint256 value
  function _traitToString(
    string memory name,
    uint256 value,
    bool comma
  ) internal pure returns (string memory) {
    if (comma) {
      return
        string(
          abi.encodePacked(
            '{"trait_type": "',
            name,
            '", "value": ',
            LibString.toString(value),
            "}, "
          )
        );
    } else {
      return
        string(
          abi.encodePacked(
            '{"trait_type": "',
            name,
            '", "value": ',
            LibString.toString(value),
            "} "
          )
        );
    }
  }
}
