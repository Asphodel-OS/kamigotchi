// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { ExperienceComponent, ID as ExpCompID } from "components/ExperienceComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { IndexKamiComponent, ID as IndexKamiCompID } from "components/IndexKamiComponent.sol";
import { IndexBackgroundComponent, ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibStat, Stat } from "libraries/LibStat.sol";

uint256 constant ID = uint256(keccak256("system.getter"));

struct AccountShape {
  uint32 index;
  string name;
  int32 currStamina;
  uint32 room;
}

struct KamiShape {
  uint256 id;
  uint32 index;
  // metadata
  string name;
  string mediaURI;
  // stats
  KamiStats stats;
  // traits
  KamiTraits traits;
  string[] affinities;
  // live
  uint256 account;
  uint256 level;
  uint256 xp;
  uint32 room;
  string state;
}

struct KamiStats {
  Stat health;
  Stat power;
  Stat harmony;
  Stat violence;
}

struct KamiTraits {
  uint32 face;
  uint32 hand;
  uint32 body;
  uint32 background;
  uint32 color;
}

/// @notice an external system to get info about various entity shapes
contract GetterSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function getAccount(uint256 id) public view returns (AccountShape memory) {
    return
      AccountShape(
        LibAccount.getIndex(components, id),
        LibAccount.getName(components, id),
        LibAccount.getCurrentStamina(components, id),
        LibAccount.getRoom(components, id)
      );
  }

  function getKamiByIndex(uint32 index) public view returns (KamiShape memory) {
    uint256 id = LibKami.getByIndex(components, index);
    require(id != 0, "Kami not found");
    return getKami(id);
  }

  function getKami(uint256 id) public view returns (KamiShape memory) {
    return
      KamiShape(
        id,
        LibKami.getIndex(components, id),
        NameComponent(getAddrByID(components, NameCompID)).get(id),
        MediaURIComponent(getAddrByID(components, MediaURICompID)).get(id),
        KamiStats(
          LibStat.get(components, "HEALTH", id),
          LibStat.get(components, "POWER", id),
          LibStat.get(components, "HARMONY", id),
          LibStat.get(components, "VIOLENCE", id)
        ),
        KamiTraits(
          IndexFaceComponent(getAddrByID(components, IndexFaceCompID)).get(id),
          IndexHandComponent(getAddrByID(components, IndexHandCompID)).get(id),
          IndexBodyComponent(getAddrByID(components, IndexBodyCompID)).get(id),
          IndexBackgroundComponent(getAddrByID(components, IndexBackgroundCompID)).get(id),
          IndexColorComponent(getAddrByID(components, IndexColorCompID)).get(id)
        ),
        LibKami.getAffinities(components, id),
        LibKami.getAccount(components, id),
        LevelComponent(getAddrByID(components, LevelCompID)).get(id),
        ExperienceComponent(getAddrByID(components, ExpCompID)).get(id),
        LibKami.getRoom(components, id),
        LibKami.getState(components, id)
      );
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
