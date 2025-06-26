import { AdminAPI } from '../api';
import { readFile } from './utils';

export async function initAuth(api: AdminAPI) {
  const rolesCSV = await readFile('auth/roles.csv');
  for (let i = 0; i < rolesCSV.length; i++) {
    // only add roles specific to the environment
    if (!rolesCSV[i]['Environment'].includes(process.env.NODE_ENV)) continue;

    const entry = rolesCSV[i];
    const roles = entry['Roles']
      .split(',')
      .map((x: string) => 'ROLE_' + x.trim().toUpperCase().replace(' ', '_'));

    for (let j = 0; j < roles.length; j++) {
      try {
        await api.auth.roles.add(entry['Address'], roles[j]);
      } catch {
        console.error('Could not add role ' + roles[j] + ' to ' + entry['Address']);
      }
    }
  }
}

export async function initLocalAuth(api: AdminAPI) {
  await api.auth.roles.add('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'ROLE_ADMIN');
  await api.auth.roles.add('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'ROLE_COMMUNITY_MANAGER');
}
