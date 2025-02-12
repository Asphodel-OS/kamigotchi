import path from 'path';

export const deploymentDir = path.join(__dirname, '../../');
export const contractsDir = path.join(deploymentDir, 'contracts/');
export const baseContractsDir = path.join(deploymentDir, '../../');
export const clientDir = path.join(deploymentDir, '../../../client/');
export const deployConfigPath = path.join('./deploy.json');

export const componentRegisterPath = path.join(clientDir, 'src/network/components/register.ts');
export const componentSchemaPath = path.join(clientDir, 'types/ComponentsSchema.ts');
