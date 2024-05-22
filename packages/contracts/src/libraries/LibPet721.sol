// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { Base64 } from "solady/utils/Base64.sol";
import { LibString } from "solady/utils/LibString.sol";
import { LibPack } from "libraries/utils/LibPack.sol";

import { Pet721ProxySystem, ID as ProxyID } from "systems/Pet721ProxySystem.sol";
import { Pet721 } from "tokens/Pet721.sol";

import { LibExperience } from "libraries/LibExperience.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibTraitRegistry } from "libraries/LibTraitRegistry.sol";
import { LibStat } from "libraries/LibStat.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";

uint256 constant NUM_TRAITS = 5;

/// @title  Library for Pet721 interactions and metadata generation functions
/// @notice used for Pet721 related systems and interactions
/// @dev    systems do not interact with the ERC721 directly, only through this lib
library LibPet721 {
  ////////////////////////
  // INTERACTIONS

  /// @notice  reveals and assigns a pet's traits. does not mint an ERC721
  /// @param   world     world contract
  /// @param   components  components contract
  /// @param   petID     entityID of pet
  /// @param   seed      seed for random generation - uses blockhash
  /// @return  packed    bitpacked traits, used for metadataURI
  function reveal(
    IWorld world,
    IUintComp components,
    uint256 petID,
    uint256 seed
  ) internal returns (uint256 packed) {
    // generates array of traits with weighted random
    uint32[] memory traits = genRandTraits(components, petID, seed);

    // setting metadata
    assignTraits(components, petID, traits);

    // emit update event
    updateEvent(world, LibPet.getIndex(components, petID));

    // returns packed traits
    packed = LibPack.packArr(traits, 8);
  }

  /// @notice  mints a pet with ERC721 for in-game kamis, with the ERC721 contract as owner
  /// @dev     this is the default state, with revealed kamis minted this way
  /// @param   world     world contract
  /// @param   index     tokenID of pet
  function mintInGame(IWorld world, uint256 index) internal {
    Pet721 token = getContract(world);
    token.mint(address(token), index);
  }

  /// @notice  mints a pet with ERC721 for out-of-game kamis, with the EOA as owner
  /// @dev     no reason to use rn, created before Mint20. does not interact with other mud systems
  /// @param   world     world contract
  /// @param   to        EOA to mint to
  /// @param   index     tokenID of pet
  function mintOutGame(IWorld world, address to, uint256 index) internal {
    Pet721 token = getContract(world);
    token.mint(to, index);
  }

  /// @notice mints multiple pets in game
  function mintInGameBatch(IWorld world, uint256 startIndex, uint256 amt) internal {
    uint256[] memory ids = new uint256[](amt);
    for (uint256 i; i < amt; i++) {
      ids[i] = startIndex + i;
    }
    Pet721 token = getContract(world);
    token.mintBatch(address(token), ids);
  }

  /// @notice mints multiple pets out of game
  function mintOutGameBatch(IWorld world, address to, uint256 startIndex, uint256 amt) internal {
    uint256[] memory ids = new uint256[](amt);
    for (uint256 i; i < amt; i++) {
      ids[i] = startIndex + i;
    }
    Pet721 token = getContract(world);
    token.mintBatch(to, ids);
  }

  /// @notice  stakes a kami, out of game -> in game ('bridging in')
  /// @dev     checks are performed in system
  /// @param   world     world contract
  /// @param   from      EOA to stake from
  /// @param   tokenID   ERC721 index of pet
  function stake(IWorld world, address from, uint256 tokenID) internal {
    Pet721 token = getContract(world);
    token.stakeToken(from, tokenID);
  }

  /// @notice  unstakes a kami, in game -> out of game
  /// @dev     checks are performed in system
  /// @param   world     world contract
  /// @param   to        EOA to unstake to
  /// @param   tokenID   ERC721 index of pet
  function unstake(IWorld world, address to, uint256 tokenID) internal {
    Pet721 token = getContract(world);
    token.unstakeToken(to, tokenID);
  }

  /// @notice  emits a metadata update event. to be called whenever metadata changes
  /// @dev     no state changes, only emits event. for marketplaces
  /// @param   world     world contract
  /// @param   tokenID   ERC721 index of pet
  function updateEvent(IWorld world, uint256 tokenID) internal {
    Pet721 token = getContract(world);
    token.emitMetadataUpdate(tokenID);
  }

  /////////////////////////
  // GETTERS

  function getContract(IWorld world) internal view returns (Pet721) {
    return Pet721ProxySystem(getAddressById(world.systems(), ProxyID)).getToken();
  }

  function getEOAOwner(IWorld world, uint256 tokenID) internal view returns (address) {
    return getContract(world).ownerOf(tokenID);
  }

  // gets current supply of kamiERC721
  function getCurrentSupply(IWorld world) internal view returns (uint256) {
    return getContract(world).totalSupply();
  }

  ////////////////////////
  // METADATA GENERATION

  /// @notice  performs random generation of traits, does NOT assign to pet
  /// @param   components  components contract
  /// @param   petID       entityID of pet
  /// @param   seed        seed for random generation
  /// @return  traits      array of traits, indices ordered [Face, Hand, Body, Background, Color]
  function genRandTraits(
    IUintComp components,
    uint256 petID,
    uint256 seed
  ) internal view returns (uint32[] memory) {
    uint32[] memory traits = new uint32[](NUM_TRAITS);
    // scoping is used to save memory while execution
    {
      // color
      (uint32[] memory keys, uint256[] memory weights) = LibTraitRegistry.getColorRarities(
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
      (uint32[] memory keys, uint256[] memory weights) = LibTraitRegistry.getBackgroundRarities(
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
      (uint32[] memory keys, uint256[] memory weights) = LibTraitRegistry.getBodyRarities(
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
      (uint32[] memory keys, uint256[] memory weights) = LibTraitRegistry.getHandRarities(
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
      (uint32[] memory keys, uint256[] memory weights) = LibTraitRegistry.getFaceRarities(
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

  /// @notice  writes assigned traits to pet
  /// @param   components  components contract
  /// @param   petID       entityID of pet
  /// @param   traits      array of traits, indices ordered [Face, Hand, Body, Background, Color]
  function assignTraits(IUintComp components, uint256 petID, uint32[] memory traits) internal {
    LibTraitRegistry.setColorIndex(components, petID, traits[4]);
    LibTraitRegistry.setBackgroundIndex(components, petID, traits[3]);
    LibTraitRegistry.setBodyIndex(components, petID, traits[2]);
    LibTraitRegistry.setHandIndex(components, petID, traits[1]);
    LibTraitRegistry.setFaceIndex(components, petID, traits[0]);
  }

  //////////////////
  // JSON STRINGIFY

  /// @notice  gets json in base64 format. for NFT marketplaces
  /// @param   components  components contract
  /// @param   petIndex    ERC721 index of pet
  /// @return  string      base64 encoded json
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
  /// @param   components  components contract
  /// @param   petIndex    ERC721 index of pet
  /// @return  string      json in UTF-8 format
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
  /// @param   components  components contract
  /// @param   petID       entityID of pet
  /// @return  string      base traits in json format
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
  /// @param   components  components contract
  /// @param   petID       entityID of pet
  /// @return  string      stats in json format
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
  /// @param   name        name of trait
  /// @param   value       value of trait
  /// @param   comma       whether to append a comma (depending on position)
  /// @return  string      { "trait_type": *name*, "value": *value* } *,*
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
  /// @param   name        name of trait
  /// @param   value       value of trait (uint256)
  /// @param   comma       whether to append a comma (depending on position)
  /// @return  string      { "trait_type": *name*, "value": *value* } *,*
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
