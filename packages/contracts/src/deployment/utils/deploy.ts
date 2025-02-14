import config from '../../../deploy.json';

export const DeployConfig = config;

export const getDeployComponents = (toMatch: string) => {
  let result = config;
  const componentsArray = toMatch.split(',').map((comp: string) => comp.trim());
  result.components = result.components.filter((component: any) =>
    componentsArray.includes(component.comp)
  );
  result.systems = [];
  return result;
};

export const getDeploySystems = (toMatch: string) => {
  let result = config;
  const systemsArray = toMatch.split(',').map((sys: string) => sys.trim());
  result.systems = result.systems.filter((system: { name: string }) =>
    systemsArray.includes(system.name)
  );
  return result;
};
