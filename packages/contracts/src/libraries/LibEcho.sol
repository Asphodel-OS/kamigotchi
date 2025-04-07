// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibPack } from "libraries/utils/LibPack.sol";

import { EntityTypeComponent, ID as EntityTypeCompID } from "components/EntityTypeComponent.sol";
import { HealthComponent, ID as HealthCompID } from "components/HealthComponent.sol";
import { HarmonyComponent, ID as HarmonyCompID } from "components/HarmonyComponent.sol";
import { IDOwnsKamiComponent, ID as IDOwnsKamiCompID } from "components/IDOwnsKamiComponent.sol";
import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBgCompID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { IndexKamiComponent, ID as IndexPetCompID } from "components/IndexKamiComponent.sol";
import { ExperienceComponent, ID as ExperienceCompID } from "components/ExperienceComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { PowerComponent, ID as PowerCompID } from "components/PowerComponent.sol";
import { SlotsComponent, ID as SlotsCompID } from "components/SlotsComponent.sol";
import { SkillPointComponent, ID as SkillPointCompID } from "components/SkillPointComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeLastActionComponent, ID as TimeLastActCompID } from "components/TimeLastActionComponent.sol";
import { TimeLastComponent, ID as TimeLastCompID } from "components/TimeLastComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ViolenceComponent, ID as ViolenceCompID } from "components/ViolenceComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { IndexRoomComponent, ID as IndexRoomCompID } from "components/IndexRoomComponent.sol";

/// @notice to re-emit state values, if needed
library LibEcho {
  function kami(IUintComp components, uint256 id) internal {
    uint256[] memory compIDs = kamiIDs();
    for (uint256 i; i < compIDs.length; i++) {
      IComponent comp = getCompByID(components, compIDs[i]);
      bytes memory raw = comp.getRaw(id);
      if (raw.length > 0) comp.set(id, raw);
    }
  }

  function room(IUintComp components, uint256 id) internal {
    IComponent comp = getCompByID(components, IndexRoomCompID);
    comp.set(id, comp.getRaw(id));
  }

  function kamiIDs() internal pure returns (uint256[] memory) {
    uint256[] memory ids = new uint256[](21);
    ids[0] = EntityTypeCompID;
    ids[1] = HealthCompID;
    ids[2] = HarmonyCompID;
    ids[3] = IDOwnsKamiCompID;
    ids[4] = IndexBodyCompID;
    ids[5] = IndexBgCompID;
    ids[6] = IndexColorCompID;
    ids[7] = IndexFaceCompID;
    ids[8] = IndexHandCompID;
    ids[9] = IndexPetCompID;
    ids[10] = ExperienceCompID;
    ids[11] = LevelCompID;
    ids[12] = MediaURICompID;
    ids[13] = NameCompID;
    ids[14] = PowerCompID;
    ids[15] = SlotsCompID;
    ids[16] = SkillPointCompID;
    ids[17] = StateCompID;
    // ids[18] = TimeLastActCompID;
    ids[18] = TimeLastCompID;
    ids[19] = TimeStartCompID;
    ids[20] = ViolenceCompID;
    return ids;
  }
}
