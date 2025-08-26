import config from '../../deploy.json';
import { compToId } from '../contracts/mappings/ComponentMappings';
import { systemToId } from '../contracts/mappings/SystemMappings';

export const DeployConfig = config;

export const getDeployComponents = (toMatch?: string) => {
  let result = config;
  result.systems = [];
  if (!toMatch) return result;
  const componentsArray = toMatch.split(',').map((comp: string) => parseCompName(comp));
  result.components = result.components.filter((component: any) =>
    componentsArray.includes(component.comp)
  );
  result.systems = [];
  return result;
};

export const getDeploySystems = (toMatch?: string) => {
  let result = config;
  if (!toMatch) return result;
  const systemsArray = toMatch.split(',').map((sys: string) => sys.trim());
  result.systems = result.systems.filter((system: { name: string }) =>
    systemsArray.includes(system.name)
  );
  return result;
};

// filter out components/systems that are not to be deployed in this env
export const filterDeployConfigByEnv = (config: any) => {
  for (let i = 0; i < config.components.length; i++) {
    const entry = config.components[i];
    if (entry.skipEnv && entry.skipEnv.includes(process.env.NODE_ENV!)) {
      config.components.splice(i, 1);
      i--;
    }
  }
  for (let i = 0; i < config.systems.length; i++) {
    const entry = config.systems[i];
    if (entry.skipEnv && entry.skipEnv.includes(process.env.NODE_ENV!)) {
      config.systems.splice(i, 1);
      i--;
    }
  }
  return config;
};

///////////////
// IDs

export const getCompIDByName = (name: string) => {
  if (!name.endsWith('Component')) name += 'Component';
  return compToId[name as keyof typeof compToId];
};

export const getSystemIDByName = (name: string) => {
  return systemToId[name as keyof typeof systemToId];
};

////////////////
// UTILS

const parseCompName = (name: string) => {
  name = name.trim();
  if (name.endsWith('Component')) return name.slice(0, -9);
  return name;
};
