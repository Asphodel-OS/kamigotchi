// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

import { CanNameComponent, ID as CanNameCompID } from "components/CanNameComponent.sol";
import { IdAccountComponent, ID as IdAccCompID } from "components/IdAccountComponent.sol";
import { IndexPetComponent, ID as IndexPetCompID } from "components/IndexPetComponent.sol";
import { IsPetComponent, ID as IsPetCompID } from "components/IsPetComponent.sol";
import { ExperienceComponent, ID as ExperienceCompID } from "components/ExperienceComponent.sol";
import { HealthCurrentComponent, ID as HealthCurrentCompID } from "components/HealthCurrentComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { SkillPointComponent, ID as SkillPointCompID } from "components/SkillPointComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeLastActionComponent, ID as TimeLastActCompID } from "components/TimeLastActionComponent.sol";
import { TimeLastComponent, ID as TimeLastCompID } from "components/TimeLastComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";

import { Pet721 } from "tokens/Pet721.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibMint20 } from "libraries/LibMint20.sol";
import { LibPet721 } from "libraries/LibPet721.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRandom } from "libraries/LibRandom.sol";
import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";

uint256 constant ID = uint256(keccak256("system.Pet721.BatchMint"));

/** @notice
 * batch minting system, for sudo pools. only can be called by admin
 * mints out of game (to a specific address)
 */
/// @dev to be called by account owner
contract _721BatchMinterSystem is System {
  /////////////
  // STRUCTS //
  /////////////
  struct TraitWeights {
    uint256 keys;
    uint256 weights;
    uint256 num;
  }

  ///////////////
  // VARIABLES //
  ///////////////

  bytes32 internal immutable baseSeed;
  TraitWeights private colorWeights;
  TraitWeights private backgroundWeights;
  TraitWeights private bodyWeights;
  TraitWeights private handWeights;
  TraitWeights private faceWeights;

  ////////////////////
  // MEMOIZED COMPS //
  ////////////////////

  Pet721 internal immutable pet721;
  CanNameComponent internal immutable canNameComp;
  IsPetComponent internal immutable isPetComp;
  IndexPetComponent internal immutable indexPetComp;
  MediaURIComponent internal immutable mediaURIComp;
  StateComponent internal immutable stateComp;
  TimeStartComponent internal immutable timeStartComp;
  TimeLastComponent internal immutable timeLastComp;
  LevelComponent internal immutable levelComp;
  ExperienceComponent internal immutable expComp;
  SkillPointComponent internal immutable skillPointComp;

  constructor(IWorld _world, address _components) System(_world, _components) {
    baseSeed = keccak256(abi.encode(blockhash(block.number - 1)));

    pet721 = LibPet721.getContract(world);
    canNameComp = CanNameComponent(getAddressById(components, CanNameCompID));
    isPetComp = IsPetComponent(getAddressById(components, IsPetCompID));
    indexPetComp = IndexPetComponent(getAddressById(components, IndexPetCompID));
    mediaURIComp = MediaURIComponent(getAddressById(components, MediaURICompID));
    stateComp = StateComponent(getAddressById(components, StateCompID));
    timeStartComp = TimeStartComponent(getAddressById(components, TimeStartCompID));
    timeLastComp = TimeLastComponent(getAddressById(components, TimeLastCompID));
    levelComp = LevelComponent(getAddressById(components, LevelCompID));
    expComp = ExperienceComponent(getAddressById(components, ExperienceCompID));
    skillPointComp = SkillPointComponent(getAddressById(components, SkillPointCompID));
  }

  /// @dev if calling many times, reduce call data by memozing address / bitpacking
  function batchMint(address to, uint256 amount) external onlyOwner {
    require(colorWeights.keys != 0, "traits not set");

    uint256 startIndex = pet721.totalSupply() + 1;

    /// @dev creating pets, unrevealed-ish state
    createPets(startIndex, amount);
    mint721s(to, startIndex, amount);

    /// @dev revealing pets
  }

  /// @dev sets trait weights. only works once; dont want to rug rarities later
  function setTraits() external onlyOwner {
    require(colorWeights.keys == 0, "already set"); // assumes all other keys are set

    // scoping is used to save memory while execution
    {
      // color
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getColorRarities(
        components
      );
      colorWeights = TraitWeights(
        LibRandom.packArray(keys, 8),
        LibRandom.packArray(weights, 8),
        keys.length
      );
    }
    {
      // background
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getBackgroundRarities(
        components
      );
      backgroundWeights = TraitWeights(
        LibRandom.packArray(keys, 8),
        LibRandom.packArray(weights, 8),
        keys.length
      );
    }
    {
      // body
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getBodyRarities(
        components
      );
      bodyWeights = TraitWeights(
        LibRandom.packArray(keys, 8),
        LibRandom.packArray(weights, 8),
        keys.length
      );
    }
    {
      // hand
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getHandRarities(
        components
      );
      handWeights = TraitWeights(
        LibRandom.packArray(keys, 8),
        LibRandom.packArray(weights, 8),
        keys.length
      );
    }
    {
      // face
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getFaceRarities(
        components
      );
      faceWeights = TraitWeights(
        LibRandom.packArray(keys, 8),
        LibRandom.packArray(weights, 8),
        keys.length
      );
    }
  }

  /////////////////////
  // TOP LEVEL LOGIC //
  /////////////////////

  /// @notice create pet, replaces LibPet.create
  function createPets(uint256 startIndex, uint256 amount) internal returns (uint256[] memory ids) {
    ids = new uint256[](amount);
    for (uint256 i; i < amount; i++) {
      uint256 id = world.getUniqueEntityId();
      ids[i] = id;

      canNameComp.set(id); // normally after reveal
      isPetComp.set(id);
      indexPetComp.set(id, startIndex + i);
      // mediaURIComp.set(id, UNREVEALED_URI);
      // stateComp.set(id, string("UNREVEALED"));
      stateComp.set(id, string("721_EXTERNAL")); // normally after reveal
      timeStartComp.set(id, block.timestamp);
      timeLastComp.set(id, block.timestamp); // normally after reveal
      levelComp.set(id, 1);
      expComp.set(id, 0);
      skillPointComp.set(id, 1);
    }
  }

  /// @notice batch mint pets, replaces LibPet721
  function mint721s(address to, uint256 startIndex, uint256 amount) internal {
    uint256[] memory indices = new uint256[](amount);
    for (uint256 i; i < amount; i++) indices[i] = startIndex + i;
    pet721.mintBatch(to, indices);
  }

  /// @notice overall reveal action
  function reveal(uint256[] memory ids, uint256 amount) internal {
    TraitWeights[] memory traitWeights = new TraitWeights[](5);
    traitWeights[0] = faceWeights;
    traitWeights[1] = handWeights;
    traitWeights[2] = bodyWeights;
    traitWeights[3] = backgroundWeights;
    traitWeights[4] = colorWeights;
    uint256 seed = baseSeed;

    for (uint256 i; i < amount; i++) {
      uint256[] memory traits = _calcTraits(seed, ids[i], traitWeights);

      // assign traits
    }
  }

  /// @notice set stats after reveal

  ////////////////////
  // INTERNAL LOGIC //
  ////////////////////

  /// @notice calculates traits, returns selected keys
  function _calcTraits(
    uint256 seed,
    uint256 id,
    TraitWeights[] memory traitWeights
  ) internal returns (uint256[] memory result) {
    result = new uint256[](5);
    for (uint256 i; i < 5; i++) {
      uint256 randN = uint256(keccak256(abi.encode(seed, id, traitWeights[i].weights)));
      results[i] = LibRandom.pSelectFromWeighted(
        traitWeights[i].keys,
        traitWeights[i].weights,
        traitWeights[i].num,
        randN,
        8
      );
    }
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
