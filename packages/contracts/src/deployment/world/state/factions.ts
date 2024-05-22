import { AdminAPI } from '../admin';

// hardcoded factions
const factions = [
  {
    index: 1,
    name: 'The Agency',
    description: 'Responsible for the Kamigotchi World tourism rewards program.',
    image: '',
  },
];

export async function initFactions(api: AdminAPI, overrideIndices?: number[]) {
  for (let i = 0; i < factions.length; i++) {
    const faction = factions[i];
    if (overrideIndices && !overrideIndices.includes(Number(faction.index))) continue;

    try {
      await initFaction(api, faction);
    } catch {
      console.error('Could not create faction', faction.index);
    }
  }
}

export async function reviseFactions(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  // else {
  //   const factionsCSV = await readFile('factions/factions.csv');
  //   for (let i = 0; i < factionsCSV.length; i++) {
  //     if (factionsCSV[i]['Status'] === 'Revise Deployment')
  //       indices.push(Number(factionsCSV[i]['Index']));
  //   }
  // }

  await deleteFactions(api, indices);
  await initFactions(api, indices);
}

export async function deleteFactions(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    try {
      await api.faction.delete(indices[i]);
    } catch {
      console.error('Could not delete faction ' + indices[i]);
    }
  }
}

async function initFaction(api: AdminAPI, faction: any) {
  await api.faction.create(faction.index, faction.name, faction.description, faction.image);
}
