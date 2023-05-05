// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

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

import { LibPet } from "libraries/LibPet.sol";
import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";
import { LibStat } from "libraries/LibStat.sol";
import { LibTrait } from "libraries/LibTrait.sol";
import { LibRandom } from "libraries/LibRandom.sol";
import { LibRarity } from "libraries/LibRarity.sol";

uint256 constant NUM_TRAITS = 5;

// Library for metadata generation functions
library LibMetadata {
  ///////////////
  // GENERATION

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
      (uint256[] memory keys, uint256[] memory weights) = getGatedFaceRarities(components, traits);
      traits[0] = LibRandom.selectFromWeighted(
        keys,
        weights,
        uint256(keccak256(abi.encode(seed, petID, "Face")))
      );
    }

    return traits;
  }

  function assignTraits(IUintComp components, uint256 petID, uint256[] memory traits) internal {
    // assigning initial traits from generated stats
    LibTrait.assignColor(components, petID, traits[4]);
    LibTrait.assignBackground(components, petID, traits[3]);
    LibTrait.assignBody(components, petID, traits[2]);
    LibTrait.assignHand(components, petID, traits[1]);
    LibTrait.assignFace(components, petID, traits[0]);
  }

  //////////////////
  // FACE SELECTION

  // selects and returns gated faces according to affinity
  // hardcoded indexes for Body (2) and Hand (1)
  function getGatedFaceRarities(
    IUintComp components,
    uint256[] memory traits
  ) internal view returns (uint256[] memory, uint256[] memory) {
    string memory bodyAffinity = LibStat.getAffinity(components, traits[2]);
    string memory handAffinity = LibStat.getAffinity(components, traits[1]);

    // both must agree, ie a 'pure' type
    if (LibString.eq(bodyAffinity, handAffinity) && LibString.eq(bodyAffinity, "INSECT")) {
      return getInsectFaceRarities(components);
    } else if (LibString.eq(bodyAffinity, handAffinity) && LibString.eq(bodyAffinity, "EERIE")) {
      return getEerieFaceRarities(components);
    } else if (LibString.eq(bodyAffinity, handAffinity) && LibString.eq(bodyAffinity, "SCRAP")) {
      return getScrapFaceRarities(components);
    } else {
      return getNormalFaceRarities(components);
    }
  }

  function getNormalFaceRarities(
    IUintComp components
  ) internal view returns (uint256[] memory, uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexFaceCompID), "");
    fragments[2] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, AffinityCompID),
      abi.encode("NORMAL")
    );
    uint256[] memory results = LibQuery.query(fragments);

    return LibRarity.getRarityKeyValueArr(components, results, IndexFaceCompID);
  }

  function getInsectFaceRarities(
    IUintComp components
  ) internal view returns (uint256[] memory, uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](4);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexFaceCompID), "");
    fragments[2] = QueryFragment(
      QueryType.NotValue,
      getComponentById(components, AffinityCompID),
      abi.encode("EERIE")
    );
    fragments[3] = QueryFragment(
      QueryType.NotValue,
      getComponentById(components, AffinityCompID),
      abi.encode("SCRAP")
    );
    uint256[] memory results = LibQuery.query(fragments);

    return LibRarity.getRarityKeyValueArr(components, results, IndexFaceCompID);
  }

  function getEerieFaceRarities(
    IUintComp components
  ) internal view returns (uint256[] memory, uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](4);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexFaceCompID), "");
    fragments[2] = QueryFragment(
      QueryType.NotValue,
      getComponentById(components, AffinityCompID),
      abi.encode("INSECT")
    );
    fragments[3] = QueryFragment(
      QueryType.NotValue,
      getComponentById(components, AffinityCompID),
      abi.encode("SCRAP")
    );
    uint256[] memory results = LibQuery.query(fragments);

    return LibRarity.getRarityKeyValueArr(components, results, IndexFaceCompID);
  }

  function getScrapFaceRarities(
    IUintComp components
  ) internal view returns (uint256[] memory, uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](4);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexFaceCompID), "");
    fragments[2] = QueryFragment(
      QueryType.NotValue,
      getComponentById(components, AffinityCompID),
      abi.encode("INSECT")
    );
    fragments[3] = QueryFragment(
      QueryType.NotValue,
      getComponentById(components, AffinityCompID),
      abi.encode("EERIE")
    );
    uint256[] memory results = LibQuery.query(fragments);

    return LibRarity.getRarityKeyValueArr(components, results, IndexFaceCompID);
  }

  //////////////////
  // JSON STRINGIFY

  function getJson(IUintComp components, uint256 petIndex) public view returns (string memory) {
    uint256 petID = LibPet.indexToID(components, petIndex);

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
          _getBaseTraits(components, petID),
          _getStats(components, petID),
          "],\n",
          '"image": "',
          LibPet.getMediaURI(components, petID),
          '"\n',
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
    names[0] = LibTrait.getBodyName(components, petID);
    names[1] = LibTrait.getColorName(components, petID);
    names[2] = LibTrait.getFaceName(components, petID);
    names[3] = LibTrait.getHandName(components, petID);
    names[4] = LibTrait.getBackgroundName(components, petID);

    for (uint256 i; i < names.length; i++) {
      string memory entry = _traitToString(comps[i], names[i]);
      result = string(abi.encodePacked(result, entry));
    }

    return result;
  }

  function _getStats(IUintComp components, uint256 petID) internal view returns (string memory) {
    string memory result = "";

    // returns result for Health, Power, Violence, and Harmony
    result = string(
      abi.encodePacked(result, _traitToString("Health", LibStat.getHealth(components, petID)))
    );
    result = string(
      abi.encodePacked(result, _traitToString("Power", LibStat.getPower(components, petID)))
    );
    result = string(
      abi.encodePacked(result, _traitToString("Violence", LibStat.getViolence(components, petID)))
    );
    result = string(
      abi.encodePacked(result, _traitToString("Harmony", LibStat.getHarmony(components, petID)))
    );

    return result;
  }

  // appends trait and trait type to metadata format
  function _traitToString(
    string memory name,
    string memory value
  ) internal pure returns (string memory) {
    return string(abi.encodePacked('{"trait_type": "', name, '", "value": "', value, '"},\n'));
  }

  // appends trait and trait type to metadata format, but with a uint256 value
  function _traitToString(string memory name, uint256 value) internal pure returns (string memory) {
    return
      string(
        abi.encodePacked(
          '{"trait_type": "',
          name,
          '", "value": "',
          LibString.toString(value),
          '"},\n'
        )
      );
  }
}
