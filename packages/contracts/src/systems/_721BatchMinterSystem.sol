// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { Uint32BareComponent } from "solecs/components/Uint32BareComponent.sol";
import { System } from "solecs/System.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";
import { LibPack } from "libraries/utils/LibPack.sol";
import { Stat } from "solecs/components/types/Stat.sol";

import { StatComponent } from "solecs/components/StatComponent.sol";
import { AffinityComponent, ID as AffinityCompID } from "components/AffinityComponent.sol";
import { EntityTypeComponent, ID as EntityTypeCompID } from "components/EntityTypeComponent.sol";
import { ExperienceComponent, ID as ExperienceCompID } from "components/ExperienceComponent.sol";
import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { HarmonyComponent, ID as HarmonyCompID } from "components/HarmonyComponent.sol";
import { IDOwnsKamiComponent, ID as IDOwnsKamiCompID } from "components/IDOwnsKamiComponent.sol";
import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBgCompID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { IndexKamiComponent, ID as IndexPetCompID } from "components/IndexKamiComponent.sol";
import { IsRegistryComponent, ID as IsRegCompID } from "components/IsRegistryComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { PowerComponent, ID as PowerCompID } from "components/PowerComponent.sol";
import { RarityComponent, ID as RarityCompID } from "components/RarityComponent.sol";
import { SlotsComponent, ID as SlotsCompID } from "components/SlotsComponent.sol";
import { SkillPointComponent, ID as SkillPointCompID } from "components/SkillPointComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { ViolenceComponent, ID as ViolenceCompID } from "components/ViolenceComponent.sol";

import { Kami721 } from "tokens/Kami721.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { GACHA_ID } from "libraries/LibGacha.sol";
import { LibKami721 } from "libraries/LibKami721.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";
import { LibTraitRegistry } from "libraries/LibTraitRegistry.sol";

uint256 constant ID = uint256(keccak256("system.Kami721.BatchMint"));

uint256 constant OFFSET_BIT_SIZE = 32;
import { BASE_NAME } from "libraries/LibKamiCreate.sol";

/////////////
// STRUCTS //
/////////////

struct TraitWeights {
  uint32[] keys;
  uint256[] weights;
}

struct TraitStats {
  int32 health;
  int32 power;
  int32 violence;
  int32 harmony;
  int32 slots;
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
  PowerComponent internal immutable powerComp;
  ViolenceComponent internal immutable violenceComp;
  HarmonyComponent internal immutable harmonyComp;
  SlotsComponent internal immutable slotsComp;
  RarityComponent internal immutable rarityComp;

  constructor(address _components) {
    components = IUintComp(_components);
    indexBackgroundComp = IndexBackgroundComponent(getAddrByID(components, IndexBgCompID));
    indexBodyComp = IndexBodyComponent(getAddrByID(components, IndexBodyCompID));
    indexColorComp = IndexColorComponent(getAddrByID(components, IndexColorCompID));
    indexFaceComp = IndexFaceComponent(getAddrByID(components, IndexFaceCompID));
    indexHandComp = IndexHandComponent(getAddrByID(components, IndexHandCompID));

    healthComp = HealthComponent(getAddrByID(components, HealthCompID));
    powerComp = PowerComponent(getAddrByID(components, PowerCompID));
    violenceComp = ViolenceComponent(getAddrByID(components, ViolenceCompID));
    harmonyComp = HarmonyComponent(getAddrByID(components, HarmonyCompID));
    slotsComp = SlotsComponent(getAddrByID(components, SlotsCompID));
    rarityComp = RarityComponent(getAddrByID(components, RarityCompID));
  }

  /////////////////////
  // TOP LEVEL LOGIC //
  /////////////////////

  /// @notice generates and assigns trait for 1, returns array of assigned traits
  function _setPetTraits(
    uint256 seed,
    uint256 id,
    TraitWeights[] memory weights
  ) internal returns (uint32[] memory) {
    uint32[] memory traits = _calcTraits(seed, id, weights);

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
    uint32[] memory traits,
    uint32[] memory offsets,
    TraitStats[] memory stats
  ) internal {
    TraitStats memory base = TraitStats(50, 10, 10, 10, 0); // base stats
    TraitStats memory delta = _calcStats(traits, offsets, stats);

    base.health += delta.health;
    base.power += delta.power;
    base.violence += delta.violence;
    base.harmony += delta.harmony;
    base.slots += delta.slots;

    healthComp.set(id, Stat(base.health, 0, 0, base.health));
    powerComp.set(id, Stat(base.power, 0, 0, 0));
    violenceComp.set(id, Stat(base.violence, 0, 0, 0));
    harmonyComp.set(id, Stat(base.harmony, 0, 0, 0));
    slotsComp.set(id, Stat(base.slots, 0, 0, base.slots));
  }

  ////////////////////
  // MEMOIZED FUNCS //
  ////////////////////

  /// @dev sets trait weights, stats, & offset only works once; dont want to rug rarities later
  function _setTraits() internal {
    require(traitWeights.length == 0, "already set"); // assumes all other keys are set

    uint32[] memory offsets = new uint32[](5);
    offsets[0] = 0;

    Uint32BareComponent[] memory traitComps = new Uint32BareComponent[](5);
    traitComps[0] = indexFaceComp;
    traitComps[1] = indexHandComp;
    traitComps[2] = indexBodyComp;
    traitComps[3] = indexBackgroundComp;
    traitComps[4] = indexColorComp;

    string[] memory traitNames = new string[](5);
    traitNames[0] = "FACE";
    traitNames[1] = "HAND";
    traitNames[2] = "BODY";
    traitNames[3] = "BACKGROUND";
    traitNames[4] = "COLOR";

    // get indices, rarities, and stats for each trait type
    for (uint256 i; i < 5; i++) {
      uint256[] memory ids = LibTraitRegistry.getAllOfType(components, traitNames[i]);
      uint32 length = uint32(ids.length);

      uint32[] memory keys = new uint32[](length);
      uint256[] memory weights = new uint256[](length);

      for (uint256 j; j < length; j++) {
        keys[j] = traitComps[i].get(ids[j]);
        weights[j] = rarityComp.has(ids[j]) ? 1 << (rarityComp.get(ids[j]) - 1) : 0;

        traitStats.push(_getTraitStats(ids[j]));
      }

      traitWeights.push(TraitWeights(keys, weights));
      if (i < 4) offsets[i + 1] = length + offsets[i];
    }

    require(traitWeights.length > 0, "batchmint: no traits detected");

    offsetsSum = LibPack.packArr(offsets, OFFSET_BIT_SIZE);
  }

  ////////////////////
  // INTERNAL LOGIC //
  ////////////////////

  /// @notice calculates traits, returns selected keys
  function _calcTraits(
    uint256 seed,
    uint256 id,
    TraitWeights[] memory weights
  ) internal view returns (uint32[] memory results) {
    results = new uint32[](5);
    for (uint256 i; i < 5; i++) {
      uint256 randN = uint256(keccak256(abi.encode(seed, id, i)));
      results[i] = LibRandom.selectFromWeighted(weights[i].keys, weights[i].weights, randN);
    }
  }

  /// @notice calculates stats, returns stats delta to update
  function _calcStats(
    uint32[] memory traits,
    uint32[] memory offsets,
    TraitStats[] memory stats
  ) internal pure returns (TraitStats memory delta) {
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

  function _getTraitStats(uint256 id) public view returns (TraitStats memory) {
    int32 health;
    int32 power;
    int32 violence;
    int32 harmony;
    int32 slots;

    if (healthComp.has(id)) health = healthComp.get(id).base;
    if (powerComp.has(id)) power = powerComp.get(id).base;
    if (violenceComp.has(id)) violence = violenceComp.get(id).base;
    if (harmonyComp.has(id)) harmony = harmonyComp.get(id).base;
    if (slotsComp.has(id)) slots = slotsComp.get(id).base;

    return TraitStats(health, power, violence, harmony, slots);
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

  IDOwnsKamiComponent internal immutable idOwnsPetComp;
  EntityTypeComponent internal immutable entityTypeComp;
  IndexKamiComponent internal immutable indexPetComp;
  MediaURIComponent internal immutable mediaURIComp;
  NameComponent internal immutable nameComp;
  StateComponent internal immutable stateComp;
  LevelComponent internal immutable levelComp;
  ExperienceComponent internal immutable expComp;
  SkillPointComponent internal immutable skillPointComp;

  constructor(
    IWorld _world,
    address _components
  ) System(_world, _components) TraitHandler(_components) {
    baseSeed = uint256(keccak256(abi.encode(blockhash(block.number == 0 ? 0 : block.number - 1))));

    idOwnsPetComp = IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID));
    entityTypeComp = EntityTypeComponent(getAddrByID(components, EntityTypeCompID));
    indexPetComp = IndexKamiComponent(getAddrByID(components, IndexPetCompID));
    mediaURIComp = MediaURIComponent(getAddrByID(components, MediaURICompID));
    nameComp = NameComponent(getAddrByID(components, NameCompID));
    stateComp = StateComponent(getAddrByID(components, StateCompID));
    levelComp = LevelComponent(getAddrByID(components, LevelCompID));
    expComp = ExperienceComponent(getAddrByID(components, ExperienceCompID));
    skillPointComp = SkillPointComponent(getAddrByID(components, SkillPointCompID));
  }

  /// @dev if calling many times, reduce call data by memozing address / bitpacking
  function batchMint(uint256 amount) external onlyOwner returns (uint256[] memory) {
    // require(colorWeights.keys != 0, "traits not set");

    uint32 startIndex = uint32(LibKami721.getContract(components).totalSupply()) + 1; // starts from 1
    uint256 startGacha = idOwnsPetComp.size(abi.encode(GACHA_ID)); // starts from 0

    /// @dev creating pets, unrevealed-ish state
    uint256[] memory ids = createPets(startIndex, startGacha, amount);

    /// @dev revealing pets
    revealPets(ids, amount);

    /// @dev minting 721s
    mint721s(startIndex, amount);

    return ids;
  }

  function setTraits() external onlyOwner {
    super._setTraits();
  }

  /////////////////////
  // TOP LEVEL LOGIC //
  /////////////////////

  /// @notice create pet, replaces LibKami.create
  function createPets(
    uint32 startIndex,
    uint256 startGacha,
    uint256 amount
  ) internal returns (uint256[] memory ids) {
    ids = new uint256[](amount);
    for (uint32 i; i < amount; i++) {
      uint32 index = startIndex + i;
      uint256 id = LibKami.genID(index);
      require(!entityTypeComp.has(id), "batchMint: id already exists");
      ids[i] = id;

      idOwnsPetComp.set(id, GACHA_ID); // seed in gacha
      entityTypeComp.set(id, string("KAMI"));
      indexPetComp.set(id, index);
      nameComp.set(id, LibString.concat(BASE_NAME, LibString.toString(startIndex + i)));
      stateComp.set(id, string("RESTING"));
      levelComp.set(id, 1);
      expComp.set(id, 0);
      skillPointComp.set(id, 1);
    }
  }

  /// @notice reveal traits
  function revealPets(uint256[] memory ids, uint256 amount) internal {
    uint256 seed = baseSeed;
    string memory _baseURI = LibConfig.getString(components, "BASE_URI");

    // memoized trait weight and stats
    TraitWeights[] memory weights = traitWeights;
    TraitStats[] memory stats = traitStats;
    uint32[] memory offsets = LibPack.unpackArr(offsetsSum, 5, OFFSET_BIT_SIZE);

    for (uint256 i; i < amount; i++) {
      uint32[] memory traits = _setPetTraits(seed, ids[i], weights);
      _setPetStats(ids[i], traits, offsets, stats);

      // set mediaURI
      mediaURIComp.set(ids[i], LibString.toString(LibPack.packArr(traits, 8)));
    }
  }

  /// @notice batch mint pets, replaces LibKami721
  function mint721s(uint256 startIndex, uint256 amount) internal {
    uint256[] memory indices = new uint256[](amount);
    for (uint256 i; i < amount; i++) indices[i] = startIndex + i;
    Kami721 pet721 = LibKami721.getContract(components);
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
