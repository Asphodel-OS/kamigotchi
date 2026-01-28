import { SystemQueue } from 'engine/queue';
import { BigNumberish } from 'ethers';

import { equipmentAPI } from './equipment';
import { harvestsAPI } from './harvests';
import { itemsAPI } from './items';
import { onyxAPI } from './onyx';
import { skillsAPI } from './skills';

export const kamisAPI = (systems: SystemQueue<any>) => {
  // level a pet, if it has enough experience
  const level = (kamiID: BigNumberish) => {
    return systems['system.kami.level'].executeTyped(kamiID);
  };

  // name / rename a pet
  const name = (kamiID: BigNumberish, name: string) => {
    return systems['system.kami.name'].executeTyped(kamiID, name);
  };

  // sacrifice a kami to receive a petpet
  const sacrificeCommit = (kamiIndex: number) => {
    return systems['system.kami.sacrifice.commit'].executeTyped(kamiIndex);
  };

  // reveal sacrifice loot
  const sacrificeReveal = (commitIDs: BigNumberish[]) => {
    return systems['system.kami.sacrifice.reveal'].executeTypedBatch(commitIDs);
  };

  return {
    level,
    name,
    sacrificeCommit,
    sacrificeReveal,
    equipment: equipmentAPI(systems),
    onyx: onyxAPI(systems),
    harvest: harvestsAPI(systems),
    item: itemsAPI(systems),
    skill: skillsAPI(systems),
  };
};
