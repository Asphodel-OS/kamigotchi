import config from '../../deploy.json';
import { compToId } from '../contracts/mappings/ComponentMappings';
import { systemToId } from '../contracts/mappings/SystemMappings';

export const DeployConfig = config;

export const getDeployComponents = (toMatch?: string) => {
  let result = config;
  result.systems = [];
  if (!toMatch) return result;
  const componentsArray = toMatch.split(',').map((comp: string) => comp.trim());
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

export const getCompIDByName = (name: string) => {
  if (!name.endsWith('Component')) name += 'Component';
  return compToId[name as keyof typeof compToId];
};

export const getSystemIDByName = (name: string) => {
  return systemToId[name as keyof typeof systemToId];
};
