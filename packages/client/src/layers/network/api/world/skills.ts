import skillsCSV from 'assets/data/skills/skills.csv';
import { AdminAPI } from '../admin';
import { sleepIf } from './utils';

export async function initSkills(api: AdminAPI) {
  for (let i = 0; i < skillsCSV.length; i++) {
    const skill = skillsCSV[i];
    await sleepIf();
    try {
      if (skill['Status'] !== 'For Implementation') continue;
      if (skill['Class'] === 'Skill' || skill['Class'] === '') await initSkill(api, skill);
      else if (skill['Class'] === 'Effect') await initSkillEffect(api, skill);
      else if (skill['Class'] === 'Requirement') await initSkillRequirement(api, skill);
    } catch {}
  }
}

export async function initSkillsByIndex(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < skillsCSV.length; i++) {
    const skill = skillsCSV[i];
    if (!indices.includes(Number(skill['Index']))) continue;
    await sleepIf();
    try {
      if (skill['Status'] !== 'For Implementation') continue;
      if (skill['Class'] === 'Skill' || skill['Class'] === '') await initSkill(api, skill);
      else if (skill['Class'] === 'Effect') await initSkillEffect(api, skill);
      else if (skill['Class'] === 'Requirement') await initSkillRequirement(api, skill);
    } catch {}
  }
}

export async function initSkill(api: AdminAPI, entry: any) {
  await api.registry.skill.create(
    Number(entry['Index']), // individual skill index
    'KAMI', // skills are only for Kami rn
    'PASSIVE', // all skills are passive rn
    entry['Tree'],
    entry['Name'], // name of skill
    entry['Description'] ?? '',
    Number(entry['Cost per level']), // cost of skill
    Number(entry['Max Lvl']), // max level of skill
    Number(entry['Tier']) - 1,
    'images/skills/' + entry['Name'].toLowerCase() + '.png' // media uri
  );
}

export async function initSkillEffect(api: AdminAPI, entry: any) {
  await api.registry.skill.add.effect(
    Number(entry['Index']), // individual skill index
    entry['ConType'], // type of effect
    entry['ConSubtype'], // subtype of effect
    entry['ConValue'] // value of effect
  );
}

export async function initSkillRequirement(api: AdminAPI, entry: any) {
  await api.registry.skill.add.requirement(
    Number(entry['Index']), // individual skill index
    entry['ConType'], // type of requirement
    entry['ConSubtype'], // logic type of requirement
    entry['ConIndex'], // index of requirement
    entry['ConValue'] // value of requirement
  );
}

export async function deleteSkills(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    await sleepIf();
    try {
      await api.registry.skill.delete(indices[i]);
    } catch {
      console.error('Could not delete skill ' + indices[i]);
    }
  }
}
