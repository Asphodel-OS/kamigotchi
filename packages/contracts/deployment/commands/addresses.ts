import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { DeployConfig, WorldAddresses } from '../utils';
import { filterDeployConfigByEnv, getCompIDByName, getSystemIDByName } from '../utils/deploy';

async function run() {
  const deploy = filterDeployConfigByEnv(DeployConfig);
  const compNames = deploy.components.map((comp: any) => comp.comp);
  const systemNames = deploy.systems.map((sys: any) => sys.name);
  const compIDs = deploy.components.map((comp: any) => getCompIDByName(comp.comp));
  const systemIDs = deploy.systems.map((sys: any) => getSystemIDByName(sys.name));

  const World = new WorldAddresses();
  await World.init();
  await load(World, compIDs, systemIDs);

  const components = [];
  for (let i = 0; i < compNames.length; i++) {
    components.push({ component: compNames[i], address: await World.getCompAddr(compIDs[i]) });
  }

  const systems = [];
  for (let i = 0; i < systemNames.length; i++) {
    systems.push({ system: systemNames[i], address: await World.getSysAddr(systemIDs[i]) });
  }

  console.table(components);
  console.table(systems);
}

run();

///////////////
// INTERNAL

// fills up data for World
async function load(World: WorldAddresses, components: string[], systems: string[]) {
  const promises = [];
  for (let i = 0; i < components.length; i++) {
    promises.push(World.getCompAddr(components[i]));
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  for (let i = 0; i < systems.length; i++) {
    promises.push(World.getSysAddr(systems[i]));
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return promises;
}
