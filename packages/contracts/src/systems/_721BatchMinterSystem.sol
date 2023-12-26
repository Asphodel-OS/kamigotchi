// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { System } from "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";

import { CanNameComponent, ID as CanNameCompID } from "components/CanNameComponent.sol";
import { IdAccountComponent, ID as IdAccCompID } from "components/IdAccountComponent.sol";
import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
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
import { LibConfig } from "libraries/LibConfig.sol";
import { LibPet721 } from "libraries/LibPet721.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRandom } from "libraries/LibRandom.sol";
import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";

uint256 constant ID = uint256(keccak256("system.Pet721.BatchMint"));

/// @notice small hopper contract to make trait handling more readable
abstract contract TraitHandler {
  /////////////
  // STRUCTS //
  /////////////

  struct TraitWeights {
    uint256 keys;
    uint256 weights;
    uint256 num;
  }

  struct Stats {
    uint8 health;
    uint8 power;
    uint8 violence;
    uint8 harmony;
    uint8 slots;
  }

  ///////////////
  // VARIABLES //
  ///////////////

  /** indices
   * face = 0
   * hand = 1
   * body = 2
   * background = 3
   * color = 4
   */
  TraitWeights[] private traitWeights;

  // memoized trait stats. all trait types, offset by number of previous type(s)
  // eg face = 0-10, hand = 11-20, body = 21-30, background = 31-40, color = 41-50
  TraitStats[] private traitStats;
  uint256 internal offsetsSum; // packed array of sum of offsets

  ////////////////////
  // MEMOIZED COMPS //
  ////////////////////

  IndexBodyComponent internal immutable indexBodyComp;
  IndexBackgroundComponent internal immutable indexBackgroundComp;
  IndexColorComponent internal immutable indexColorComp;
  IndexFaceComponent internal immutable indexFaceComp;
  IndexHandComponent internal immutable indexHandComp;

  constructor(address _components) {
    IUintComp components = IUintComp(_components);
    indexBodyComp = IndexBodyComponent(getAddressById(components, IndexBodyCompID));
    indexBackgroundComp = IndexBackgroundComponent(
      getAddressById(components, IndexBackgroundCompID)
    );
    indexColorComp = IndexColorComponent(getAddressById(components, IndexColorCompID));
    indexFaceComp = IndexFaceComponent(getAddressById(components, IndexFaceCompID));
    indexHandComp = IndexHandComponent(getAddressById(components, IndexHandCompID));
  }

  /////////////////////
  // TOP LEVEL LOGIC //
  /////////////////////

  /// @notice generates and assigns trait for 1, returns array of assigned traits
  function _setPetTraits(uint256 seed, uint256 id) internal returns (uint256[] memory) {
    uint256[] memory traits = _calcTraits(seed, id, traitWeights);

    indexFaceComp.set(id, traits[0]);
    indexHandComp.set(id, traits[1]);
    indexBodyComp.set(id, traits[2]);
    indexBackgroundComp.set(id, traits[3]);
    indexColorComp.set(id, traits[4]);

    return traits;
  }

  /// @notice generates and assigns stats for 1
  function _setPetStats(
    uint256 id,
    TraitStats memory base,
    uint256[] memory traits,
    uint256[] memory offsets,
    TraitStats[] memory stats
  ) internal {
    TraitStats memory delta = _calcStats(traits, offsets, stats);

    base.health += delta.health;
    base.power += delta.power;
    base.violence += delta.violence;
    base.harmony += delta.harmony;
    base.slots += delta.slots;

    HealthCurrentComponent(getAddressById(components, HealthCurrentCompID)).set(id, delta.health);
    LevelComponent(getAddressById(components, LevelCompID)).set(id, 1);
    ExperienceComponent(getAddressById(components, ExperienceCompID)).set(id, 0);
    SkillPointComponent(getAddressById(components, SkillPointCompID)).set(id, 1);
  }

  ////////////////////
  // MEMOIZED FUNCS //
  ////////////////////

  /// @dev sets trait weights & offset only works once; dont want to rug rarities later
  function _setTraits() internal {
    require(traitWeights[0].keys == 0, "already set"); // assumes all other keys are set

    uint256[] memory results = new uint256[](5);
    uint256[] memory offsets = new uint256[](5);

    // scoping is used to save memory while execution
    {
      // color
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getColorRarities(
        components
      );
      results[4] = TraitWeights(
        LibRandom.packArray(keys, 8),
        LibRandom.packArray(weights, 8),
        keys.length
      );
      offsets[4] = keys.length;
    }
    {
      // background
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getBackgroundRarities(
        components
      );
      results[3] = TraitWeights(
        LibRandom.packArray(keys, 8),
        LibRandom.packArray(weights, 8),
        keys.length
      );
      offsets[3] = keys.length;
    }
    {
      // body
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getBodyRarities(
        components
      );
      results[2] = TraitWeights(
        LibRandom.packArray(keys, 8),
        LibRandom.packArray(weights, 8),
        keys.length
      );
      offsets[2] = keys.length;
    }
    {
      // hand
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getHandRarities(
        components
      );
      results[1] = TraitWeights(
        LibRandom.packArray(keys, 8),
        LibRandom.packArray(weights, 8),
        keys.length
      );
      offsets[1] = keys.length;
    }
    {
      // face
      (uint256[] memory keys, uint256[] memory weights) = LibRegistryTrait.getFaceRarities(
        components
      );
      results[0] = TraitWeights(
        LibRandom.packArray(keys, 8),
        LibRandom.packArray(weights, 8),
        keys.length
      );
      offsets[0] = keys.length;
    }

    traitWeights = results;
    offsetsSum = LibRandom.packArray(offsets, 8);
  }

  /// @notice set trait stats, in a struct. only works once
  /// @dev need to format locally. likely a solidity script
  function _setStats(TraitStats[] calldata stats) internal {
    require(traitStats.length == 0, "already set");
    traitStats = stats;
  }

  ////////////////////
  // INTERNAL LOGIC //
  ////////////////////

  /// @notice calculates traits, returns selected keys
  function _calcTraits(
    uint256 seed,
    uint256 id,
    TraitWeights[] memory traitWeights
  ) internal returns (uint256[] memory results) {
    results = new uint256[](5);
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

  /// @notice calculates stats, returns stats delta to update
  function _calcStats(
    uint256[] memory traits,
    uint256[] memory offsets,
    TraitStats[] memory stats
  ) internal returns (TraitStats memory delta) {
    delta = TraitStats(0, 0, 0, 0, 0);
    uint256 offset;
    for (uint256 i; i < 5; i++) {
      offset += offsets[i];
      TraitStats memory curr = stats[offsets + traits[i]];
      delta.health += curr.health;
      delta.power += curr.power;
      delta.violence += curr.violence;
      delta.harmony += curr.harmony;
      delta.slots += curr.slots;
    }
  }
}

/** @notice
 * batch minting system, for sudo pools. only can be called by admin
 * mints out of game (to a specific address)
 */
/// @dev to be called by account owner
contract _721BatchMinterSystem is System, TraitHandler {
  /////////////
  // STRUCTS //
  /////////////

  ///////////////
  // VARIABLES //
  ///////////////

  uint256 internal immutable baseSeed;

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

  constructor(
    IWorld _world,
    address _components
  ) System(_world, _components) TraitHandler(_components) {
    baseSeed = uint256(keccak256(abi.encode(blockhash(block.number - 1))));

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
    // require(colorWeights.keys != 0, "traits not set");

    uint256 startIndex = pet721.totalSupply() + 1;

    /// @dev creating pets, unrevealed-ish state
    createPets(startIndex, amount);
    mint721s(to, startIndex, amount);

    /// @dev revealing pets
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

  /// @notice reveal traits
  function reveal(uint256[] memory ids, uint256 amount) internal {
    TraitWeights[] memory traitWeights = new TraitWeights[](5); // HERE!
    uint256 seed = baseSeed;
    string memory _baseURI = LibConfig.getValueStringOf(components, "BASE_URI");

    for (uint256 i; i < amount; i++) {
      uint256[] memory traits = _setPetTraits(seed, ids[i]);

      // set mediaURI
      mediaURIComp.set(
        ids[i],
        LibString.concat(
          _baseURI,
          LibString.concat(LibString.toString(LibRandom.packArray(traits, 8)), ".gif")
        )
      );
    }
  }

  function setTraits() external onlyOwner {
    super._setTraits();
  }

  /// @notice batch mint pets, replaces LibPet721
  function mint721s(address to, uint256 startIndex, uint256 amount) internal {
    uint256[] memory indices = new uint256[](amount);
    for (uint256 i; i < amount; i++) indices[i] = startIndex + i;
    pet721.mintBatch(to, indices);
  }

  /// @notice set stats after reveal

  ////////////////////
  // INTERNAL LOGIC //
  ////////////////////

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
