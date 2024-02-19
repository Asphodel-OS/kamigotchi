import ejs from "ejs";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const contractsDir = path.join(__dirname, "../../");

/**
 * Generate LibDeploy.sol from deploy.json
 * @param configPath path to deploy.json
 * @param out output directory for LibDeploy.sol
 * @param systems optional, only generate deploy code for the given systems
 * @returns path to generated LibDeploy.sol
 */
export async function generateLibDeploy(
  configPath: string,
  out: string,
  components?: string,
  systems?: string
) {
  // Parse config
  const config = JSON.parse(await readFile(configPath, { encoding: "utf8" }));

  if (components && systems)
    console.error(
      "cannot update both components and systems at the same time, please update one at a time."
    );

  // Filter components
  if (components) {
    const componentsArray = components.split(",").map((comp: string) => comp.trim());
    config.components = config.components.filter((component: string) =>
      componentsArray.includes(component)
    );
    config.systems = [];
  }
  // Filter systems
  if (systems) {
    const systemsArray = systems.split(",").map((sys: string) => sys.trim());
    config.systems = config.systems.filter((system: { name: string }) =>
      systemsArray.includes(system.name)
    );
  }

  console.log(`Deploy config: \n`, JSON.stringify(config, null, 2));

  // Generate LibDeploy
  console.log("Generating deployment script");
  const LibDeploy = await ejs.renderFile(path.join(contractsDir, "LibDeploy.ejs"), config, {
    async: true,
  });
  const libDeployPath = path.join(out, "LibDeploy.sol");
  await writeFile(libDeployPath, LibDeploy);

  return libDeployPath;
}
