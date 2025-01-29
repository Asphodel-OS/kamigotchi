// SPDX-License-Identifier: MIT
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
  using SafeCastLib for int32;

  ////////////////////////
  // INTERACTIONS

  /// @notice  stakes a kami, out of game -> in game ('bridging in')
  /// @dev     checks are performed in system
  function stake(IUintComp components, address owner, uint256 kamiIndex) internal {
    Kami721 token = getContract(components);
    token.stakeToken(owner, kamiIndex);
  }

  /// @notice  unstakes a kami, in game -> out of game
  /// @dev     checks are performed in system
  function unstake(IUintComp components, address to, uint256 kamiIndex) internal {
    Kami721 token = getContract(components);
    token.unstakeToken(to, kamiIndex);
  }

  /// @notice  emits a metadata update event. to be called whenever metadata changes
  /// @dev     no state changes, only emits event. for marketplaces
  function updateEvent(IUintComp components, uint256 kamiIndex) internal {
    Kami721 token = getContract(components);
    token.emitMetadataUpdate(kamiIndex);
  }

  /////////////////////////
  // GETTERS

  function getContract(IUintComp components) internal view returns (Kami721) {
    address addr = LibConfig.getAddress(components, "KAMI721_ADDRESS");
    // return Kami721(0xc769462cc8C72A4A2497eEEcf0C818E8BbEc8310);
    return Kami721(addr);
  }

  function getEOAOwner(IUintComp components, uint256 kamiIndex) internal view returns (address) {
    return getContract(components).ownerOf(kamiIndex);
  }

  function getMediaURI(IUintComp components, uint256 id) internal view returns (string memory) {
    return MediaURIComponent(getAddrByID(components, MediaURICompID)).get(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddrByID(components, NameCompID)).get(id);
  }

  ////////////////////////
  // METADATA

  /// @notice  gets json in base64 format. for NFT marketplaces
  function getJsonBase64(
    IUintComp components,
    uint32 petIndex
  ) public view returns (string memory) {
    return
      LibString.concat(
        "data:application/json;base64,",
        Base64.encode(abi.encodePacked(getJsonUtf(components, petIndex)), false, false)
      );
  }

  /// @notice  gets json in UTF-8 format. to view in plaintext
  function getJsonUtf(IUintComp components, uint32 petIndex) public view returns (string memory) {
    uint256 kamiID = LibKami.getByIndex(components, petIndex);

    /// TODO: add affinities somewhere

    return
      string(
        abi.encodePacked(
          "{",
          '"external_url": "https://kamigotchi.io", ',
          '"name": "',
          getName(components, kamiID),
          '", ',
          '"description": ',
          '"a lil network spirit :3", ',
          '"attributes": [',
          _getBaseTraits(components, kamiID),
          _getStats(components, kamiID),
          "], ",
          '"image": "',
          getMediaURI(components, kamiID),
          '"',
          "}"
        )
      );
  }

  /// @notice  gets and parses base traits (body, color, face, hand, background)
  function _getBaseTraits(
    IUintComp components,
    uint256 kamiID
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
    names[0] = LibTraitRegistry.getBodyNameOf(components, kamiID);
    names[1] = LibTraitRegistry.getColorNameOf(components, kamiID);
    names[2] = LibTraitRegistry.getFaceNameOf(components, kamiID);
    names[3] = LibTraitRegistry.getHandNameOf(components, kamiID);
    names[4] = LibTraitRegistry.getBackgroundNameOf(components, kamiID);

    for (uint256 i; i < names.length; i++) {
      string memory entry = _traitToString(comps[i], names[i], true);
      result = string(abi.encodePacked(result, entry));
    }

    return result;
  }

  /// @notice  gets and parses the 4 main stats (health, power, violence, harmony) and level
  function _getStats(IUintComp components, uint256 kamiID) internal view returns (string memory) {
    string memory result = "";

    // returns result for Health, Power, Violence, and Harmony
    result = string(
      abi.encodePacked(
        result,
        _traitToString(
          "Health",
          LibStat.getStatComp(components, "HEALTH").safeGet(kamiID).base.toUint256(),
          true
        )
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString(
          "Power",
          LibStat.getStatComp(components, "POWER").safeGet(kamiID).base.toUint256(),
          true
        )
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString(
          "Violence",
          LibStat.getStatComp(components, "VIOLENCE").safeGet(kamiID).base.toUint256(),
          true
        )
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString(
          "Harmony",
          LibStat.getStatComp(components, "HARMONY").safeGet(kamiID).base.toUint256(),
          true
        )
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString("Level", LibExperience.getLevel(components, kamiID), false)
      )
    );

    return result;
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
