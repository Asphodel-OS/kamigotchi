// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { Base64 } from "solady/utils/Base64.sol";
import { LibString } from "solady/utils/LibString.sol";

import { Pet721 } from "tokens/Pet721.sol";

import { LibConfig } from "libraries/LibConfig.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibTraitRegistry } from "libraries/LibTraitRegistry.sol";
import { LibStat } from "libraries/LibStat.sol";

uint256 constant NUM_TRAITS = 5;

/// @title  Library for Pet721 interactions and metadata generation functions
/// @notice used for Pet721 related systems and interactions
/// @dev    systems do not interact with the ERC721 directly, only through this lib
library LibPet721 {
  ////////////////////////
  // INTERACTIONS

  /// @notice  stakes a kami, out of game -> in game ('bridging in')
  /// @dev     checks are performed in system
  function stake(IUintComp components, address from, uint256 tokenID) internal {
    Pet721 token = getContract(components);
    token.stakeToken(from, tokenID);
  }

  /// @notice  unstakes a kami, in game -> out of game
  /// @dev     checks are performed in system
  function unstake(IUintComp components, address to, uint256 tokenID) internal {
    Pet721 token = getContract(components);
    token.unstakeToken(to, tokenID);
  }

  /// @notice  emits a metadata update event. to be called whenever metadata changes
  /// @dev     no state changes, only emits event. for marketplaces
  function updateEvent(IUintComp components, uint256 tokenID) internal {
    Pet721 token = getContract(components);
    token.emitMetadataUpdate(tokenID);
  }

  /////////////////////////
  // GETTERS

  function getContract(IUintComp components) internal view returns (Pet721) {
    address addr = address(uint160(LibConfig.get(components, "PET721_ADDRESS")));
    // return Pet721(0xc769462cc8C72A4A2497eEEcf0C818E8BbEc8310);
    return Pet721(addr);
  }

  function getEOAOwner(IUintComp components, uint256 tokenID) internal view returns (address) {
    return getContract(components).ownerOf(tokenID);
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
    uint256 petID = LibPet.getByIndex(components, petIndex);

    /// TODO: add affinities somewhere

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

  /// @notice  gets and parses base traits (body, color, face, hand, background)
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
    names[0] = LibTraitRegistry.getBodyNameOf(components, petID);
    names[1] = LibTraitRegistry.getColorNameOf(components, petID);
    names[2] = LibTraitRegistry.getFaceNameOf(components, petID);
    names[3] = LibTraitRegistry.getHandNameOf(components, petID);
    names[4] = LibTraitRegistry.getBackgroundNameOf(components, petID);

    for (uint256 i; i < names.length; i++) {
      string memory entry = _traitToString(comps[i], names[i], true);
      result = string(abi.encodePacked(result, entry));
    }

    return result;
  }

  /// @notice  gets and parses the 4 main stats (health, power, violence, harmony) and level
  function _getStats(IUintComp components, uint256 petID) internal view returns (string memory) {
    string memory result = "";

    // returns result for Health, Power, Violence, and Harmony
    result = string(
      abi.encodePacked(
        result,
        _traitToString("Health", uint256(uint32(LibStat.getHealthTotal(components, petID))), true)
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString("Power", uint256(uint32(LibStat.getPowerTotal(components, petID))), true)
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString(
          "Violence",
          uint256(uint32(LibStat.getViolenceTotal(components, petID))),
          true
        )
      )
    );
    result = string(
      abi.encodePacked(
        result,
        _traitToString("Harmony", uint256(uint32(LibStat.getHarmonyTotal(components, petID))), true)
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
