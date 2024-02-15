// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "forge-std/console.sol";

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { System } from "solecs/System.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { LibString } from "solady/utils/LibString.sol";

import { AffinityComponent, ID as AffinityCompID } from "components/AffinityComponent.sol";
import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { CanNameComponent, ID as CanNameCompID } from "components/CanNameComponent.sol";
import { GachaOrderComponent, ID as GachaOrderCompID } from "components/GachaOrderComponent.sol";
import { HealthCurrentComponent, ID as HealthCurrentCompID } from "components/HealthCurrentComponent.sol";
import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { HarmonyComponent, ID as HarmonyCompID } from "components/HarmonyComponent.sol";
import { IdAccountComponent, ID as IdAccCompID } from "components/IdAccountComponent.sol";
import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { IndexPetComponent, ID as IndexPetCompID } from "components/IndexPetComponent.sol";
import { IndexTraitComponent, ID as IndexTraitCompID } from "components/IndexTraitComponent.sol";
import { IsPetComponent, ID as IsPetCompID } from "components/IsPetComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { ExperienceComponent, ID as ExperienceCompID } from "components/ExperienceComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { PowerComponent, ID as PowerCompID } from "components/PowerComponent.sol";
import { RarityComponent, ID as RarityCompID } from "components/RarityComponent.sol";
import { SlotsComponent, ID as SlotsCompID } from "components/SlotsComponent.sol";
import { SkillPointComponent, ID as SkillPointCompID } from "components/SkillPointComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeLastActionComponent, ID as TimeLastActCompID } from "components/TimeLastActionComponent.sol";
import { TimeLastComponent, ID as TimeLastCompID } from "components/TimeLastComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ViolenceComponent, ID as ViolenceCompID } from "components/ViolenceComponent.sol";

import { Pet721 } from "tokens/Pet721.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { GACHA_DATA_ID } from "libraries/LibGacha.sol";
import { LibPet721 } from "libraries/LibPet721.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRandom } from "libraries/LibRandom.sol";
import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";

uint256 constant ID = uint256(keccak256("system.Pet721.BatchMint"));

uint256 constant OFFSET_BIT_SIZE = 32;

/////////////
// STRUCTS //
/////////////

struct TraitWeights {
  uint256[] keys;
  uint256[] weights;
}

struct TraitStats {
  uint8 health;
  uint8 power;
  uint8 violence;
  uint8 harmony;
  uint8 slots;
}

/// @notice small contract to make trait handling more readable
abstract contract TraitHandler {
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
  TraitWeights[] internal traitWeights;

  // memoized trait stats. all trait types, offset by number of previous type(s)
  // eg face = 0-10, hand = 11-20, body = 21-30, background = 31-40, color = 41-50
  TraitStats[] internal traitStats;
  uint256 internal offsetsSum; // packed array of sum of offsets

  ////////////////////
  // MEMOIZED COMPS //
  ////////////////////

  IUintComp private immutable components;

  IndexBodyComponent internal immutable indexBodyComp;
  IndexBackgroundComponent internal immutable indexBackgroundComp;
  IndexColorComponent internal immutable indexColorComp;
  IndexFaceComponent internal immutable indexFaceComp;
  IndexHandComponent internal immutable indexHandComp;

  HealthComponent internal immutable healthComp;
  HealthCurrentComponent internal immutable healthCurrentComp;
  PowerComponent internal immutable powerComp;
  ViolenceComponent internal immutable violenceComp;
  HarmonyComponent internal immutable harmonyComp;
  SlotsComponent internal immutable slotsComp;
  RarityComponent internal immutable rarityComp;

  constructor(address _components) {
    components = IUintComp(_components);
    indexBodyComp = IndexBodyComponent(getAddressById(components, IndexBodyCompID));
    indexBackgroundComp = IndexBackgroundComponent(
      getAddressById(components, IndexBackgroundCompID)
    );
    indexColorComp = IndexColorComponent(getAddressById(components, IndexColorCompID));
    indexFaceComp = IndexFaceComponent(getAddressById(components, IndexFaceCompID));
    indexHandComp = IndexHandComponent(getAddressById(components, IndexHandCompID));

    healthComp = HealthComponent(getAddressById(components, HealthCompID));
    healthCurrentComp = HealthCurrentComponent(getAddressById(components, HealthCurrentCompID));
    powerComp = PowerComponent(getAddressById(components, PowerCompID));
    violenceComp = ViolenceComponent(getAddressById(components, ViolenceCompID));
    harmonyComp = HarmonyComponent(getAddressById(components, HarmonyCompID));
    slotsComp = SlotsComponent(getAddressById(components, SlotsCompID));
    rarityComp = RarityComponent(getAddressById(components, RarityCompID));
  }

  /////////////////////
  // TOP LEVEL LOGIC //
  /////////////////////

  /// @notice generates and assigns trait for 1, returns array of assigned traits
  function _setPetTraits(
    uint256 seed,
    uint256 id,
    TraitWeights[] memory weights
  ) internal returns (uint256[] memory) {
    uint256[] memory traits = _calcTraits(seed, id, weights);

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
    uint256[] memory traits,
    uint256[] memory offsets,
    TraitStats[] memory stats
  ) internal {
    TraitStats memory base = TraitStats(50, 10, 10, 10, 0); // base stats
    TraitStats memory delta = _calcStats(traits, offsets, stats);

    base.health += delta.health;
    base.power += delta.power;
    base.violence += delta.violence;
    base.harmony += delta.harmony;
    base.slots += delta.slots;

    healthComp.set(id, abi.encode(base.health));
    healthCurrentComp.set(id, abi.encode(base.health));
    powerComp.set(id, abi.encode(base.power));
    violenceComp.set(id, abi.encode(base.violence));
    harmonyComp.set(id, abi.encode(base.harmony));
    slotsComp.set(id, abi.encode(base.slots));
  }

  ////////////////////
  // MEMOIZED FUNCS //
  ////////////////////

  /// @dev sets trait weights, stats, & offset only works once; dont want to rug rarities later
  function _setTraits() internal {
    require(traitWeights.length == 0, "already set"); // assumes all other keys are set

    uint256[] memory offsets = new uint256[](5);
    offsets[0] = 0;

    IUintComp[] memory traitComps = new IUintComp[](5);
    traitComps[0] = indexFaceComp;
    traitComps[1] = indexHandComp;
    traitComps[2] = indexBodyComp;
    traitComps[3] = indexBackgroundComp;
    traitComps[4] = indexColorComp;

    // get indices, rarities, and stats for each trait type
    for (uint256 i; i < 5; i++) {
      uint256[] memory ids = queryTraitsOfType(traitComps[i]);
      uint256 length = ids.length;

      uint256[] memory keys = new uint256[](length);
      uint256[] memory weights = new uint256[](length);

      for (uint256 j; j < length; j++) {
        keys[j] = traitComps[i].getValue(ids[j]);
        weights[j] = rarityComp.has(ids[j]) ? 3 ** (rarityComp.getValue(ids[j]) - 1) : 0;

        traitStats.push(_getTraitStats(ids[j]));
      }

      traitWeights.push(TraitWeights(keys, weights));
      if (i < 4) offsets[i + 1] = length + offsets[i];
    }

    offsetsSum = LibRandom.packArray(offsets, OFFSET_BIT_SIZE);
  }

  ////////////////////
  // INTERNAL LOGIC //
  ////////////////////

  /// @notice calculates traits, returns selected keys
  function _calcTraits(
    uint256 seed,
    uint256 id,
    TraitWeights[] memory weights
  ) internal returns (uint256[] memory results) {
    results = new uint256[](5);
    for (uint256 i; i < 5; i++) {
      uint256 randN = uint256(keccak256(abi.encode(seed, id, i)));
      results[i] = LibRandom.selectFromWeighted(weights[i].keys, weights[i].weights, randN);
    }
  }

  /// @notice calculates stats, returns stats delta to update
  function _calcStats(
    uint256[] memory traits,
    uint256[] memory offsets,
    TraitStats[] memory stats
  ) internal returns (TraitStats memory delta) {
    delta = TraitStats(0, 0, 0, 0, 0);
    for (uint256 i; i < 5; i++) {
      TraitStats memory curr = stats[offsets[i] + traits[i]];
      delta.health += curr.health;
      delta.power += curr.power;
      delta.violence += curr.violence;
      delta.harmony += curr.harmony;
      delta.slots += curr.slots;
    }
  }

  function _getTraitStats(uint256 id) public returns (TraitStats memory) {
    return
      TraitStats(
        uint8(healthComp.has(id) ? healthComp.getValue(id) : 0),
        uint8(powerComp.has(id) ? powerComp.getValue(id) : 0),
        uint8(violenceComp.has(id) ? violenceComp.getValue(id) : 0),
        uint8(harmonyComp.has(id) ? harmonyComp.getValue(id) : 0),
        uint8(slotsComp.has(id) ? slotsComp.getValue(id) : 0)
      );
  }

  /// @notice query all traits of a type (ie face) in registry. returns entityIDs
  function queryTraitsOfType(IUintComp comp) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](3);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegCompID), "");
    fragments[1] = QueryFragment(QueryType.Has, getComponentById(components, IndexTraitCompID), "");
    fragments[2] = QueryFragment(QueryType.Has, comp, "");
    uint256[] memory results = LibQuery.query(fragments);
    return results;
  }
}

/** @notice
 * batch minting and reveal system, to seed initial gacha pool.
 * mints in game
 */
/// @dev to be called by account owner
contract _721BatchMinterSystem is System, TraitHandler {
  ///////////////
  // VARIABLES //
  ///////////////

  uint256 internal immutable baseSeed;

  ////////////////////
  // MEMOIZED COMPS //
  ////////////////////

  Pet721 internal immutable pet721;
  CanNameComponent internal immutable canNameComp;
  GachaOrderComponent internal immutable gachaOrderComp;
  IsPetComponent internal immutable isPetComp;
  IndexPetComponent internal immutable indexPetComp;
  MediaURIComponent internal immutable mediaURIComp;
  NameComponent internal immutable nameComp;
  StateComponent internal immutable stateComp;
  TimeStartComponent internal immutable timeStartComp;
  TimeLastComponent internal immutable timeLastComp;
  LevelComponent internal immutable levelComp;
  ExperienceComponent internal immutable expComp;
  SkillPointComponent internal immutable skillPointComp;
  BalanceComponent internal immutable balanceComp;

  constructor(
    IWorld _world,
    address _components
  ) System(_world, _components) TraitHandler(_components) {
    baseSeed = uint256(keccak256(abi.encode(blockhash(block.number - 1))));

    pet721 = LibPet721.getContract(world);
    canNameComp = CanNameComponent(getAddressById(components, CanNameCompID));
    gachaOrderComp = GachaOrderComponent(getAddressById(components, GachaOrderCompID));
    isPetComp = IsPetComponent(getAddressById(components, IsPetCompID));
    indexPetComp = IndexPetComponent(getAddressById(components, IndexPetCompID));
    mediaURIComp = MediaURIComponent(getAddressById(components, MediaURICompID));
    nameComp = NameComponent(getAddressById(components, NameCompID));
    stateComp = StateComponent(getAddressById(components, StateCompID));
    timeStartComp = TimeStartComponent(getAddressById(components, TimeStartCompID));
    timeLastComp = TimeLastComponent(getAddressById(components, TimeLastCompID));
    levelComp = LevelComponent(getAddressById(components, LevelCompID));
    expComp = ExperienceComponent(getAddressById(components, ExperienceCompID));
    skillPointComp = SkillPointComponent(getAddressById(components, SkillPointCompID));
    balanceComp = BalanceComponent(getAddressById(components, BalanceCompID));
  }

  /// @dev if calling many times, reduce call data by memozing address / bitpacking
  function batchMint(uint256 amount) external onlyOwner returns (uint256[] memory) {
    // require(colorWeights.keys != 0, "traits not set");

    uint32 startIndex = uint32(pet721.totalSupply()) + 1; // starts from 1
    uint256 startGacha = balanceComp.getValue(GACHA_DATA_ID); // starts from 0

    /// @dev creating pets, unrevealed-ish state
    uint256[] memory ids = createPets(startIndex, startGacha, amount);

    /// @dev revealing pets
    revealPets(ids, amount);

    /// @dev minting 721s
    mint721s(startIndex, amount);

    // update gacha total
    balanceComp.set(GACHA_DATA_ID, startGacha + amount);

    return ids;
  }

  function setTraits() external onlyOwner {
    super._setTraits();
  }

  /////////////////////
  // TOP LEVEL LOGIC //
  /////////////////////

  /// @notice create pet, replaces LibPet.create
  function createPets(
    uint32 startIndex,
    uint256 startGacha,
    uint256 amount
  ) internal returns (uint256[] memory ids) {
    ids = new uint256[](amount);
    for (uint32 i; i < amount; i++) {
      uint256 id = world.getUniqueEntityId();
      ids[i] = id;

      canNameComp.set(id); // normally after reveal
      gachaOrderComp.set(id, startGacha + i);
      isPetComp.set(id);
      indexPetComp.set(id, startIndex + i);
      nameComp.set(id, LibString.concat("kamigotchi ", LibString.toString(startIndex + i)));
      stateComp.set(id, string("GACHA")); // seed in gacha
      timeStartComp.set(id, block.timestamp);
      timeLastComp.set(id, block.timestamp); // normally after reveal
      levelComp.set(id, 1);
      expComp.set(id, 0);
      skillPointComp.set(id, 1);
    }
  }

  /// @notice reveal traits
  function revealPets(uint256[] memory ids, uint256 amount) internal {
    uint256 seed = baseSeed;
    string memory _baseURI = LibConfig.getValueStringOf(components, "BASE_URI");

    // memoized trait weight and stats
    TraitWeights[] memory weights = traitWeights;
    TraitStats[] memory stats = traitStats;
    uint256[] memory offsets = LibRandom.unpackArray(offsetsSum, 5, OFFSET_BIT_SIZE);

    for (uint256 i; i < amount; i++) {
      uint256[] memory traits = _setPetTraits(seed, ids[i], weights);
      _setPetStats(ids[i], traits, offsets, stats);

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

  /// @notice batch mint pets, replaces LibPet721
  function mint721s(uint256 startIndex, uint256 amount) internal {
    uint256[] memory indices = new uint256[](amount);
    for (uint256 i; i < amount; i++) indices[i] = startIndex + i;
    pet721.mintBatch(address(pet721), indices);
  }

  ////////////////////
  // INTERNAL LOGIC //
  ////////////////////

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
