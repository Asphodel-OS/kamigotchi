// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";
import { Base64 } from "solady/utils/Base64.sol";
import { LibString } from "solady/utils/LibString.sol";

import { Kami721 } from "tokens/Kami721.sol";

import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";

import { LibConfig } from "libraries/LibConfig.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibTraitRegistry } from "libraries/LibTraitRegistry.sol";
import { LibStat } from "libraries/LibStat.sol";

uint256 constant NUM_TRAITS = 5;

/// @title  Library for Kami721 interactions and metadata generation functions
/// @notice used for Kami721 related systems and interactions
/// @dev    systems do not interact with the ERC721 directly, only through this lib
library LibKami721 {
  using LibString for string;
  using SafeCastLib for int32;

  ////////////////////////
  // INTERACTIONS

  /// @notice  stakes a kami, out of game -> in game ('bridging in')
  /// @dev     checks are performed in system
  function stake(IUintComp comps, address owner, uint256 kamiIndex) internal {
    Kami721 token = getContract(comps);
    token.stakeToken(owner, kamiIndex);
  }

  /// @notice  unstakes a kami, in game -> out of game
  /// @dev     checks are performed in system
  function unstake(IUintComp comps, address to, uint256 kamiIndex) internal {
    Kami721 token = getContract(comps);
    token.unstakeToken(to, kamiIndex);
  }

  /// @notice  emits a metadata update event. to be called whenever metadata changes
  /// @dev     no state changes, only emits event. for marketplaces
  function updateEvent(IUintComp comps, uint256 kamiIndex) internal {
    Kami721 token = getContract(comps);
    token.emitMetadataUpdate(kamiIndex);
  }

  /////////////////////////
  // GETTERS

  function getContract(IUintComp comps) internal view returns (Kami721) {
    address addr = LibConfig.getAddress(comps, "KAMI721_ADDRESS");
    return Kami721(addr);
  }

  function getEOAOwner(IUintComp comps, uint256 kamiIndex) internal view returns (address) {
    return getContract(comps).ownerOf(kamiIndex);
  }

  /// @dev only imageID is stored in MediaURI. combine it with Config BASE_URI to get URI
  function getMediaURI(IUintComp comps, uint256 id) internal view returns (string memory) {
    string memory image = MediaURIComponent(getAddrByID(comps, MediaURICompID)).get(id);
    string memory baseURI = LibConfig.getString(comps, "BASE_URI");

    return string(abi.encodePacked("https://", baseURI, "/", image, ".gif"));
  }

  function getName(IUintComp comps, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddrByID(comps, NameCompID)).get(id);
  }

  ////////////////////////
  // METADATA

  /// @notice  gets json in base64 format. for NFT marketplaces
  function getJsonBase64(IUintComp comps, uint32 kamiIndex) public view returns (string memory) {
    return
      LibString.concat(
        "data:application/json;base64,",
        Base64.encode(abi.encodePacked(getJsonUtf(comps, kamiIndex)), false, false)
      );
  }

  /// @notice  gets json in UTF-8 format. to view in plaintext
  function getJsonUtf(IUintComp comps, uint32 kamiIndex) public view returns (string memory) {
    uint256 kamiID = LibKami.getByIndex(comps, kamiIndex);

    return
      string(
        abi.encodePacked(
          "{",
          '"external_url": "https://kamigotchi.io", ',
          '"name": "',
          getName(comps, kamiID),
          '", ',
          '"description": ',
          '"a lil network spirit :3", ',
          '"attributes": [',
          _getBaseTraits(comps, kamiID),
          _getAffinities(comps, kamiID),
          _getStats(comps, kamiID),
          "], ",
          '"image": "',
          getMediaURI(comps, kamiID),
          '"',
          "}"
        )
      );
  }

  /// @notice  gets and parses base traits (body, color, face, hand, background)
  function _getBaseTraits(IUintComp comps, uint256 kamiID) internal view returns (string memory) {
    string memory result = "";

    // getting values of base traits. values are hardcoded to array position
    string[] memory traitTypes = new string[](5);
    traitTypes[0] = "Body";
    traitTypes[1] = "Color";
    traitTypes[2] = "Face";
    traitTypes[3] = "Hand";
    traitTypes[4] = "Background";

    string[] memory names = new string[](5);
    names[0] = LibTraitRegistry.getNameOf(comps, kamiID, "BODY");
    names[1] = LibTraitRegistry.getNameOf(comps, kamiID, "COLOR");
    names[2] = LibTraitRegistry.getNameOf(comps, kamiID, "FACE");
    names[3] = LibTraitRegistry.getNameOf(comps, kamiID, "HAND");
    names[4] = LibTraitRegistry.getNameOf(comps, kamiID, "BACKGROUND");

    for (uint256 i; i < names.length; i++) {
      string memory entry = _traitToString(traitTypes[i], names[i], true);
      result = string(abi.encodePacked(result, entry));
    }

    return result;
  }

  /// @notice  gets and parses the 4 main stats (health, power, violence, harmony) and level
  function _getStats(IUintComp comps, uint256 kamiID) internal view returns (string memory) {
    string memory result = "";

    // returns result for Health, Power, Violence, and Harmony
    result = string(
      abi.encodePacked(
        result,
        _traitToString(
          "Health",
          LibStat.getStatComp(comps, "HEALTH").safeGet(kamiID).base.toUint256(),
          true
        )
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString(
          "Power",
          LibStat.getStatComp(comps, "POWER").safeGet(kamiID).base.toUint256(),
          true
        )
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString(
          "Violence",
          LibStat.getStatComp(comps, "VIOLENCE").safeGet(kamiID).base.toUint256(),
          true
        )
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString(
          "Harmony",
          LibStat.getStatComp(comps, "HARMONY").safeGet(kamiID).base.toUint256(),
          true
        )
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString("Level", LibExperience.getLevel(comps, kamiID), false)
      )
    );

    return result;
  }

  function _getAffinities(IUintComp comps, uint256 kamiID) internal view returns (string memory) {
    string memory affinity = LibKami.getBodyAffinity(comps, kamiID);
    string memory bodyText = string(
      abi.encodePacked('{"trait_type": "Body Affinity", "value": "', affinity, '"}, ')
    );
    affinity = LibKami.getHandAffinity(comps, kamiID);
    string memory handText = string(
      abi.encodePacked('{"trait_type": "Hand Affinity", "value": "', affinity, '"}, ')
    );
    return string(abi.encodePacked(bodyText, handText));
  }

  /// @notice  appends trait and trait type to metadata format
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

  /// @notice  appends trait and trait type to metadata format
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
