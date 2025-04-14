import { BigNumberish } from 'ethers';
import { harvestsAPI } from './harvests';
import { itemsAPI } from './items';
import { skillsAPI } from './skills';

export const kamisAPI = (systems: any) => {
  // level a pet, if it has enough experience
  const level = (kamiID: BigNumberish) => {
    return systems['system.kami.level'].executeTyped(kamiID);
  };

  // name / rename a pet
  const name = (kamiID: BigNumberish, name: string) => {
    return systems['system.kami.name'].executeTyped(kamiID, name);
  };

  return {
    level,
    name,
    harvest: harvestsAPI(systems),
    item: itemsAPI(systems),
    skill: skillsAPI(systems),
  };
};
