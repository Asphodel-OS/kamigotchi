// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { Uint32BareComponent } from "solecs/components/Uint32BareComponent.sol";
import { System } from "solecs/System.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { LibString } from "solady/utils/LibString.sol";
import { LibPack } from "libraries/utils/LibPack.sol";
import { Stat } from "solecs/components/types/Stat.sol";

import { StatComponent } from "solecs/components/StatComponent.sol";
import { EntityTypeComponent, ID as EntityTypeComponentID } from "components/EntityTypeComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "components/HealthComponent.sol";
import { HarmonyComponent, ID as HarmonyComponentID } from "components/HarmonyComponent.sol";
import { IDOwnsKamiComponent, ID as IDOwnsKamiComponentID } from "components/IDOwnsKamiComponent.sol";
import { IndexBodyComponent, ID as IndexBodyComponentID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBackgroundComponentID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorComponentID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceComponentID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandComponentID } from "components/IndexHandComponent.sol";
import { IndexKamiComponent, ID as IndexKamiComponentID } from "components/IndexKamiComponent.sol";
import { IsRegistryComponent, ID as IsRegComponentID } from "components/IsRegistryComponent.sol";
import { ExperienceComponent, ID as ExperienceComponentID } from "components/ExperienceComponent.sol";
import { LevelComponent, ID as LevelComponentID } from "components/LevelComponent.sol";
import { MediaURIComponent, ID as MediaURIComponentID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameComponentID } from "components/NameComponent.sol";
import { PowerComponent, ID as PowerComponentID } from "components/PowerComponent.sol";
import { RarityComponent, ID as RarityComponentID } from "components/RarityComponent.sol";
import { SlotsComponent, ID as SlotsComponentID } from "components/SlotsComponent.sol";
import { SkillPointComponent, ID as SkillPointComponentID } from "components/SkillPointComponent.sol";
import { StateComponent, ID as StateComponentID } from "components/StateComponent.sol";
import { TimeLastActionComponent, ID as TimeLastActComponentID } from "components/TimeLastActionComponent.sol";
import { TimeLastComponent, ID as TimeLastComponentID } from "components/TimeLastComponent.sol";
import { TimeStartComponent, ID as TimeStartComponentID } from "components/TimeStartComponent.sol";
import { ViolenceComponent, ID as ViolenceComponentID } from "components/ViolenceComponent.sol";
import { ValueComponent, ID as ValueComponentID } from "components/ValueComponent.sol";

import { Kami721 } from "tokens/Kami721.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibKami721 } from "libraries/LibKami721.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";
import { LibTraitRegistry } from "libraries/LibTraitRegistry.sol";

import { LibQuests } from "libraries/LibQuests.sol";

uint256 constant ID = uint256(keccak256("system.Kami721.create"));

uint256 constant OFFSET_BIT_SIZE = 32;

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

/// @notice allows the creation of a pet with fixed traits. expected to be used at the start of a world, then deprecated
/** @dev
 * a BatchMinter fork
 * note: foundry takes a really long while to load this when deploying in bulk - ethersjs is much more reliable
 */
contract _CreatePetSystem is System {
  TraitWeights[] internal traitWeights;

  // memoized trait stats. all trait types, offset by number of previous type(s)
  // eg face = 0-10, hand = 11-20, body = 21-30, background = 31-40, color = 41-50
  /** indices
   * face = 0
   * hand = 1
   * body = 2
   * background = 3
   * color = 4
   */
  TraitStats[] internal traitStats;
  uint32[5] internal offsets;

  IDOwnsKamiComponent internal immutable idOwnsKamiComp;
  EntityTypeComponent internal immutable entityTypeComp;
  IndexKamiComponent internal immutable indexKamiComp;
  MediaURIComponent internal immutable mediaURIComp;
  NameComponent internal immutable nameComp;
  StateComponent internal immutable stateComp;
  TimeStartComponent internal immutable timeStartComp;
  TimeLastComponent internal immutable timeLastComp;
  LevelComponent internal immutable levelComp;
  ExperienceComponent internal immutable expComp;
  SkillPointComponent internal immutable skillPointComp;
  ValueComponent internal immutable balanceComp;

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

  constructor(IWorld _world, address _components) System(_world, _components) {
    idOwnsKamiComp = IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiComponentID));
    entityTypeComp = EntityTypeComponent(getAddrByID(components, EntityTypeComponentID));
    indexKamiComp = IndexKamiComponent(getAddrByID(components, IndexKamiComponentID));
    mediaURIComp = MediaURIComponent(getAddrByID(components, MediaURIComponentID));
    nameComp = NameComponent(getAddrByID(components, NameComponentID));
    stateComp = StateComponent(getAddrByID(components, StateComponentID));
    timeStartComp = TimeStartComponent(getAddrByID(components, TimeStartComponentID));
    timeLastComp = TimeLastComponent(getAddrByID(components, TimeLastComponentID));
    levelComp = LevelComponent(getAddrByID(components, LevelComponentID));
    expComp = ExperienceComponent(getAddrByID(components, ExperienceComponentID));
    skillPointComp = SkillPointComponent(getAddrByID(components, SkillPointComponentID));
    balanceComp = ValueComponent(getAddrByID(components, ValueComponentID));

    indexBackgroundComp = IndexBackgroundComponent(
      getAddrByID(components, IndexBackgroundComponentID)
    );
    indexBodyComp = IndexBodyComponent(getAddrByID(components, IndexBodyComponentID));
    indexColorComp = IndexColorComponent(getAddrByID(components, IndexColorComponentID));
    indexFaceComp = IndexFaceComponent(getAddrByID(components, IndexFaceComponentID));
    indexHandComp = IndexHandComponent(getAddrByID(components, IndexHandComponentID));

    healthComp = HealthComponent(getAddrByID(components, HealthComponentID));
    powerComp = PowerComponent(getAddrByID(components, PowerComponentID));
    violenceComp = ViolenceComponent(getAddrByID(components, ViolenceComponentID));
    harmonyComp = HarmonyComponent(getAddrByID(components, HarmonyComponentID));
    slotsComp = SlotsComponent(getAddrByID(components, SlotsComponentID));
    rarityComp = RarityComponent(getAddrByID(components, RarityComponentID));
  }

  // needs to be called after world state init
  function setTraits() external onlyOwner {
    _setUpTraits();
  }

  /////////////////////
  // TOP LEVEL LOGIC //
  /////////////////////

  function create(
    address accAddr,
    uint32 background,
    uint32 body,
    uint32 color,
    uint32 face,
    uint32 hand
  ) external onlyOwner {
    uint256 accID = uint256(uint160(accAddr));
    // creating pet
    uint256 kamiID = _create(accID, background, body, color, face, hand);

    // setting quests completitions
    uint256 questID = LibQuests.assign(world, components, 1, accID);
    LibQuests.setCompleted(components, questID);
    LibQuests.assign(world, components, 57, accID);
  }

  function _create(
    uint256 accID,
    uint32 background,
    uint32 body,
    uint32 color,
    uint32 face,
    uint32 hand
  ) internal returns (uint256 id) {
    uint32 index = uint32(LibKami721.getContract(components).totalSupply()) + 1; // starts from 1

    id = LibKami.genID(index);
    require(!entityTypeComp.has(id), "batchMint: id already exists");

    entityTypeComp.set(id, string("KAMI"));
    idOwnsKamiComp.set(id, accID);
    indexKamiComp.set(id, index);
    nameComp.set(id, LibString.concat("kamigotchi ", LibString.toString(index)));
    stateComp.set(id, string("RESTING"));
    timeStartComp.set(id, block.timestamp);
    timeLastComp.set(id, block.timestamp);
    levelComp.set(id, 1);
    skillPointComp.set(id, 1);
    expComp.set(id, 0);

    uint32[] memory traits = new uint32[](5);
    traits[0] = face;
    traits[1] = hand;
    traits[2] = body;
    traits[3] = background;
    traits[4] = color;
    _setPetTraits(id, traits);

    Kami721 pet721 = LibKami721.getContract(components);
    pet721.mint(address(pet721), uint256(index));
  }

  /// @notice set traits and stats
  function _setPetTraits(uint256 id, uint32[] memory traits) internal {
    indexFaceComp.set(id, traits[0]);
    indexHandComp.set(id, traits[1]);
    indexBodyComp.set(id, traits[2]);
    indexBackgroundComp.set(id, traits[3]);
    indexColorComp.set(id, traits[4]);
    mediaURIComp.set(
      id,
      LibString.concat(
        "https://i.test.asphodel.io/kami/",
        LibString.concat(LibString.toString(LibPack.packArr(traits, 8)), ".gif")
      )
    );

    // setting stats
    TraitStats memory base = TraitStats(50, 10, 10, 10, 0); // base stats
    TraitStats memory delta = _calcStats(traits);

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
  // INTERNAL LOGIC //
  ////////////////////

  /// @notice calculates stats, returns stats delta to update
  function _calcStats(uint32[] memory traits) internal view returns (TraitStats memory delta) {
    delta = TraitStats(0, 0, 0, 0, 0);
    for (uint256 i; i < 5; i++) {
      TraitStats memory curr = traitStats[offsets[i] + traits[i]];
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

  ///////////////////
  // SET UP LOGIC //
  ///////////////////

  /// @dev sets trait weights, stats, & offset only works once; dont want to rug rarities later
  function _setUpTraits() internal {
    require(traitWeights.length == 0, "already set"); // assumes all other keys are set

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
  }

  ///////////////////
  // OTHERS

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {}
}
