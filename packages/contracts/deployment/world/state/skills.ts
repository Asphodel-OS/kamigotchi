import { AdminAPI } from '../api';
import { readFile, toDelete, toRevise } from './utils';

// inits all skills or by optional indices parameter
export async function initSkills(api: AdminAPI, indices?: number[]) {
  const skillsCSV = await readFile('skills/skills.csv');
  const effectsCSV = await readFile('skills/effects.csv');
  for (let i = 0; i < skillsCSV.length; i++) {
    const skill = skillsCSV[i];
    const index = Number(skill['Index']);
    if (!index) continue;

    if (indices && !indices.includes(index)) continue; // optional indices filter

    try {
      await initSkill(api, skill);
      await initBonus(api, skill, effectsCSV);
      await initMutualExclusionRequirement(api, skill);
    } catch (e) {
      console.error(`Could not create skill ${index}`, e);
    }
  }
}

export async function deleteSkills(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const skillsCSV = await readFile('skills/skills.csv');
    for (let i = 0; i < skillsCSV.length; i++) {
      if (toDelete(skillsCSV[i])) indices.push(Number(skillsCSV[i]['Index']));
    }
  }

  for (let i = 0; i < indices.length; i++) {
    try {
      await api.registry.skill.delete(indices[i]);
    } catch {
      console.error('Could not delete skill ' + indices[i]);
    }
  }
}

export async function reviseSkills(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const skillsCSV = await readFile('skills/skills.csv');
    for (let i = 0; i < skillsCSV.length; i++) {
      if (toRevise(skillsCSV[i])) indices.push(Number(skillsCSV[i]['Index']));
    }
  }

  await deleteSkills(api, indices);
  await initSkills(api, indices);
}

async function initSkill(api: AdminAPI, skill: any) {
  const index = Number(skill['Index']);
  const name = skill['Name'].trim();
  const filename = name.toLowerCase().replace(/ /g, '_');
  const mediaUri = `images/skills/${filename}.png`;
  const description = skill['Description'] ?? '';
  const tree = skill['Tree'];
  const cost = Number(skill['Cost']);
  const max = Number(skill['Max']);
  const tier = Number(skill['Tier']);

  await api.registry.skill.create(
    index,
    'KAMI', // skills are only for Kami rn
    tree,
    name,
    description,
    cost,
    max,
    tier - 1,
    mediaUri
  );
}

async function initBonus(api: AdminAPI, skill: any, effectsCSV: any) {
  const index = Number(skill['Index']);
  const key = skill['Effect'].split(' ')[0];
  const effect = effectsCSV.find((e: any) => e['Key'] === key);

  const rawType = effect['Type'].toUpperCase(); // effect context
  const ast = effect['AsphoAST'].toUpperCase();
  const operation = effect['Operation'].toUpperCase();
  const type = `${rawType}_${ast}_${operation}`;
  const value = Number(skill['Value']) * 10 ** Number(effect['Precision']);

  await api.registry.skill.add.bonus(index, type, value);
}

// only processes Mutual Exclusion requirement for now
async function initMutualExclusionRequirement(api: AdminAPI, skill: any) {
  const index = Number(skill['Index']);
  const keys = skill['Exclusion'];
  if (!keys) return;

  const values = keys.split(',');
  values.forEach(async (v: string) => {
    await api.registry.skill.add.requirement(index, 'SKILL', 'CURR_MAX', Number(v), 0, '');
  });
}
