// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { Stat } from "solecs/components/types/Stat.sol";

import { Kami721 } from "tokens/Kami721.sol";

import { Uint32Component } from "solecs/components/Uint32Component.sol";
import { AffinityComponent, ID as AffinityCompID } from "components/AffinityComponent.sol";
import { ExperienceComponent, ID as ExperienceCompID } from "components/ExperienceComponent.sol";
import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { HarmonyComponent, ID as HarmonyCompID } from "components/HarmonyComponent.sol";
import { IDOwnsKamiComponent, ID as IDOwnsKamiCompID } from "components/IDOwnsKamiComponent.sol";
import { IndexKamiComponent, ID as IndexKamiCompID } from "components/IndexKamiComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { PowerComponent, ID as PowerCompID } from "components/PowerComponent.sol";
import { SlotsComponent, ID as SlotsCompID } from "components/SlotsComponent.sol";
import { SkillPointComponent, ID as SkillPointCompID } from "components/SkillPointComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { ViolenceComponent, ID as ViolenceCompID } from "components/ViolenceComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";
import { LibPack } from "libraries/utils/LibPack.sol";

import { LibConfig } from "libraries/LibConfig.sol";
import { LibCommit } from "libraries/LibCommit.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKami721 } from "libraries/LibKami721.sol";
import { LibTraitRegistry, TraitStats } from "libraries/LibTraitRegistry.sol";

import { GACHA_ID } from "libraries/LibGacha.sol";
string constant BASE_NAME = string("test kamigotchi ");

/**
 * @notice handles specifically kami creation, entity and ERC721
 *
 * Shape (implemented in BatchMinter):
 * - EntityType: KAMI
 * - IDOwnsKami: Owner (usually Account, but can be other entities)
 * - IndexKami
 * - Name
 * - State [RESTING, HARVESTING, DEAD, 721_EXTERNAL]
 * - MediaURI
 * - TimeLast (not added - use safeGet when needed)
 * - Experience
 * - Level
 * - SkillPoints
 * - Traits
 *   - IndexFace
 *   - IndexHand
 *   - IndexBody
 *   - IndexBackground
 *   - IndexColor
 * - Stats
 *   - Health
 *   - Power
 *   - Violence
 *   - Harmony
 *   - Slots
 * - Flags
 *   - NOT_NAMABLE: default false (kamis can be named by default)
 */
library LibKamiCreate {
  using LibString for string;

  function create(IUintComp comps) internal returns (uint256 id) {
    uint32 index = getNextIndex(comps);
    id = LibKami.genID(index);
    if (LibEntityType.checkAndSet(comps, id, "KAMI")) revert("kami already exists");

    setBase(comps, id, index);
    uint32[] memory traits = setTraits(comps, id);
    setStats(comps, id, traits);
    setURI(comps, id, traits);
    Kami721 nft = LibKami721.getContract(comps);
    nft.mint(address(nft), id);
  }

  function create(IUintComp comps, uint256 amt) internal returns (uint256[] memory ids) {
    ids = new uint256[](amt);
    for (uint256 i; i < amt; i++) ids[i] = create(comps);
  }

  /////////////////
  // SETTERS

  function setBase(IUintComp comps, uint256 id, uint32 index) internal {
    IDOwnsKamiComponent(getAddrByID(comps, IDOwnsKamiCompID)).set(id, GACHA_ID); // seed in gacha
    IndexKamiComponent(getAddrByID(comps, IndexKamiCompID)).set(id, index);
    NameComponent(getAddrByID(comps, NameCompID)).set(id, makeName(index));
    StateComponent(getAddrByID(comps, StateCompID)).set(id, string("RESTING"));
    LevelComponent(getAddrByID(comps, LevelCompID)).set(id, 1);
    SkillPointComponent(getAddrByID(comps, SkillPointCompID)).set(id, 1);
    ExperienceComponent(getAddrByID(comps, ExperienceCompID)).set(id, 0);
  }

  function setTraits(IUintComp comps, uint256 id) internal returns (uint32[] memory traits) {
    uint256 seed = LibCommit.hashSeed(block.number - 1, id);

    traits = new uint32[](5);
    string[] memory types = LibTraitRegistry.getTypeNames();
    for (uint256 i; i < 5; i++) {
      traits[i] = setTrait(comps, id, types[i], uint256(keccak256(abi.encode(seed, i))));
    }
  }

  function setStats(IUintComp comps, uint256 id, uint32[] memory traits) internal {
    TraitStats memory base = TraitStats(50, 10, 10, 10, 0); // base stats

    string[] memory types = LibTraitRegistry.getTypeNames();
    for (uint256 i; i < 5; i++) {
      TraitStats memory delta = LibTraitRegistry.getStatsByIndex(comps, traits[i], types[i]);
      base = LibTraitRegistry.addStats(base, delta);
    }

    HealthComponent(getAddrByID(comps, HealthCompID)).set(id, Stat(base.health, 0, 0, base.health));
    PowerComponent(getAddrByID(comps, PowerCompID)).set(id, Stat(base.power, 0, 0, 0));
    ViolenceComponent(getAddrByID(comps, ViolenceCompID)).set(id, Stat(base.violence, 0, 0, 0));
    HarmonyComponent(getAddrByID(comps, HarmonyCompID)).set(id, Stat(base.harmony, 0, 0, 0));
    SlotsComponent(getAddrByID(comps, SlotsCompID)).set(id, Stat(base.slots, 0, 0, base.slots));
  }

  function setURI(IUintComp comps, uint256 id, uint32[] memory traits) internal {
    string memory baseURI = LibConfig.getString(comps, "BASE_URI");
    string memory image = LibString.toString(LibPack.packArr(traits, 8));
    string memory uri = string(abi.encodePacked(baseURI, "/", image, ".gif"));

    MediaURIComponent(getAddrByID(comps, MediaURICompID)).set(id, uri);
  }

  function setTrait(
    IUintComp comps,
    uint256 id,
    string memory _type,
    uint256 seed
  ) internal returns (uint32 index) {
    (uint32[] memory keys, uint256[] memory weights) = LibTraitRegistry.getRarities(comps, _type);
    index = LibRandom.selectFromWeighted(keys, weights, seed);

    // setting trait
    Uint32Component indexComp = LibTraitRegistry.getIndexComp(comps, _type);
    indexComp.set(id, index);
  }

  ////////////////
  // GETTERS

  function getNextIndex(IUintComp comps) internal view returns (uint32) {
    return uint32(LibKami721.getContract(comps).totalSupply()) + 1;
  }

  /////////////////
  // UTILS

  function makeName(uint32 index) internal pure returns (string memory) {
    return BASE_NAME.concat(LibString.toString(index));
  }
}
