// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { HarmonyComponent, ID as HarmonyCompID } from "components/HarmonyComponent.sol";
import { PowerComponent, ID as PowerCompID } from "components/PowerComponent.sol";
import { SlotsComponent, ID as SlotsCompID } from "components/SlotsComponent.sol";
import { ViolenceComponent, ID as ViolenceCompID } from "components/ViolenceComponent.sol";
import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";

import { TraitWeights, TraitStats } from "systems/_721BatchMinterSystem.sol";
import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";

/// @notice for scripting; temporary holding place for batch mint utils. for local use
contract BatchMintUtils {
  HealthComponent internal immutable healthComp;
  HarmonyComponent internal immutable harmonyComp;
  PowerComponent internal immutable powerComp;
  SlotsComponent internal immutable slotsComp;
  ViolenceComponent internal immutable violenceComp;

  constructor(IUintComp components) {
    healthComp = HealthComponent(getAddressById(components, HealthCompID));
    harmonyComp = HarmonyComponent(getAddressById(components, HarmonyCompID));
    powerComp = PowerComponent(getAddressById(components, PowerCompID));
    slotsComp = SlotsComponent(getAddressById(components, SlotsCompID));
    violenceComp = ViolenceComponent(getAddressById(components, ViolenceCompID));
  }

  function getAllStats(IUintComp components) public returns (TraitStats[] memory stats) {
    uint256[] memory ids = getAllIDs(components);
    stats = new TraitStats[](ids.length);
    for (uint256 i; i < ids.length; i++) {
      stats[i] = getStatFromTrait(components, ids[i]);
    }
  }

  function getAllIDs(IUintComp components) public returns (uint256[] memory ids) {
    uint256[] memory faces = LibRegistryTrait.getAllOfType(components, IndexFaceCompID);
    uint256[] memory hands = LibRegistryTrait.getAllOfType(components, IndexHandCompID);
    uint256[] memory bodies = LibRegistryTrait.getAllOfType(components, IndexBodyCompID);
    uint256[] memory backgrounds = LibRegistryTrait.getAllOfType(components, IndexBackgroundCompID);
    uint256[] memory colors = LibRegistryTrait.getAllOfType(components, IndexColorCompID);

    ids = new uint256[](
      faces.length + hands.length + bodies.length + backgrounds.length + colors.length
    );

    uint256 n = 0;
    for (uint256 i; i < faces.length; i++) {
      ids[n] = faces[i];
      n++;
    }
    for (uint256 i; i < hands.length; i++) {
      ids[n] = hands[i];
      n++;
    }
    for (uint256 i; i < bodies.length; i++) {
      ids[n] = bodies[i];
      n++;
    }
    for (uint256 i; i < backgrounds.length; i++) {
      ids[n] = backgrounds[i];
      n++;
    }
    for (uint256 i; i < colors.length; i++) {
      ids[n] = colors[i];
      n++;
    }
  }

  function getStatFromTrait(IUintComp components, uint256 id) public returns (TraitStats memory) {
    return
      TraitStats(
        uint8(healthComp.has(id) ? healthComp.getValue(id) : 0),
        uint8(powerComp.has(id) ? powerComp.getValue(id) : 0),
        uint8(violenceComp.has(id) ? violenceComp.getValue(id) : 0),
        uint8(harmonyComp.has(id) ? harmonyComp.getValue(id) : 0),
        uint8(slotsComp.has(id) ? slotsComp.getValue(id) : 0)
      );
  }
}
