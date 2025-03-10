import {
  genClientSystemData,
  genContractSystemData,
  generateComponentSchemas,
} from '../scripts/codegen';

const run = async () => {
  genClientSystemData();
  genContractSystemData();
  generateComponentSchemas();
};

run();
