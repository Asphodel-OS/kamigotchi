import { triggerKamiAdoptionAgencyModal, triggerTempleOfTheWheelModal } from 'app/triggers';
import { NpcImages } from 'assets/images/npcs';
import { DialogueNode } from './types';

import dialoguesCsv from './data/npcDialogues.csv';
import npcsCsv from './data/npcs.csv';

// all of this will be handled by contracts in the future
// this is just a placeholder

type DialogueData = {
  npcIndex?: number;
  mood?: string;
  text: string;
  nextDialogue?: number;
  choiceDialogueIndices?: number[];
};
type CsvRow = Record<string, string>;

const npcByIndex = new Map<number, NonNullable<DialogueNode['npc']>>();
const npcIndexByName = new Map<string, number>();
const dialogueByIndex = new Map<number, DialogueData>();
const npcRows: CsvRow[] = npcsCsv;
const dialogueRows: CsvRow[] = dialoguesCsv;

const ritualMap: Record<string, { name: string; onclick: () => void }> = {
  'Kami Sacrifice': {
    name: 'Kami Sacrifice',
    onclick: () => triggerTempleOfTheWheelModal(),
  },
  'Kami Adoption Agency': {
    name: 'Kami Adoption Agency',
    onclick: () => triggerKamiAdoptionAgencyModal(),
  },
};
const imageMap = NpcImages;

const normalizeKey = (key: string) => key.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const getField = (row: CsvRow, keys: string[]) => {
  const normalizedRow = new Map<string, string>();
  Object.entries(row).forEach(([key, value]) => {
    normalizedRow.set(normalizeKey(key), value);
  });

  for (const key of keys) {
    const value = normalizedRow.get(normalizeKey(key));
    if (value !== undefined) return value;
  }
  return undefined;
};

const toNumberOrUndefined = (raw?: string) => {
  if (!raw?.trim()) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

// returns image url if theres any
const resolveImage = (raw?: string) => {
  const key = raw?.trim();
  if (!key) return '';
  const basename = key.split('/').pop() ?? key;
  const corrected = basename.endsWith('_png') ? `${basename.slice(0, -4)}.png` : basename;
  const normalized = corrected.includes('.') ? corrected : `${corrected}.png`;
  return imageMap[normalized] ?? '';
};

// parse dialogue text
const parseDialogueText = (raw: string | undefined) => {
  if (!raw) return [''];
  const parts = raw.includes('||') ? raw.split('||') : [raw];
  return parts.map((part) => {
    return part.replaceAll('\\n', '\n').replaceAll('\\r', '\r');
  });
};

// load NPC data
const loadNpcs = () => {
  npcRows.forEach((rawRow) => {
    const index = toNumberOrUndefined(getField(rawRow, ['index']));
    if (index === undefined) return;

    const name = getField(rawRow, ['name'])?.trim() ?? '';
    const img = resolveImage(getField(rawRow, ['default image', 'image']));
    const color = getField(rawRow, ['text color', 'color'])?.trim() || undefined;
    const ritualName = getField(rawRow, ['ritual', 'rituals'])?.trim();
    const special = ritualName
      ? (ritualMap[ritualName] ?? { name: ritualName, onclick: () => {} })
      : undefined;
    const npc = {
      name,
      img,
      color,
      special,
    };

    npcByIndex.set(index, npc);
    npcIndexByName.set(name.trim().toLowerCase(), index);
  });
};

// load dialogue data
const loadDialogues = () => {
  dialogueRows.forEach((rawRow) => {
    const index = toNumberOrUndefined(getField(rawRow, ['index']));
    if (index === undefined) return;

    const npcRef = getField(rawRow, ['npcIndex', 'npc index', 'npc'])?.trim();
    const numericNpcIndex = toNumberOrUndefined(npcRef);
    const npcIndex =
      numericNpcIndex ??
      (npcRef ? npcIndexByName.get(npcRef.toLowerCase().replace(/\s+/g, ' ').trim()) : undefined);
    const mood = resolveImage(getField(rawRow, ['mood'])) || undefined;
    const text = getField(rawRow, ['text']) ?? '';
    const nextDialogue = toNumberOrUndefined(getField(rawRow, ['nextDialogue', 'next dialogue']));
    const choiceDialogueIndices = (getField(rawRow, ['choice']) ?? '')
      .split(',')
      .map((value) => toNumberOrUndefined(value.trim()))
      .filter((value): value is number => value !== undefined);

    dialogueByIndex.set(index, {
      npcIndex,
      mood,
      text,
      nextDialogue,
      choiceDialogueIndices,
    });
  });
};

loadNpcs();
loadDialogues();

const buildDialogueNode = (index: number): DialogueNode => {
  const row = dialogueByIndex.get(index);
  if (!row) return { index, text: [''] };

  const npcBase = row.npcIndex !== undefined ? npcByIndex.get(row.npcIndex) : undefined;
  const dialogueSprite = row.mood || npcBase?.img;

  const npc = npcBase
    ? {
        ...npcBase,
        mood: dialogueSprite,
        nextDialogue: row.nextDialogue,
      }
    : undefined;

  const next = new Map<string, number>();
  row.choiceDialogueIndices?.forEach((choiceIndex) => {
    const choiceRow = dialogueByIndex.get(choiceIndex);
    if (!choiceRow?.nextDialogue) return;
    const [label] = parseDialogueText(choiceRow.text);
    if (!label) return;
    next.set(label, choiceRow.nextDialogue);
  });

  return {
    index,
    text: parseDialogueText(row.text),
    npc,
    next: next.size > 0 ? next : undefined,
  };
};

// fetch dialogue data with resolved NPC info
export const getNpcDialogueByIndex = (index: number): DialogueNode => {
  return buildDialogueNode(index);
};

export const getAllNpcDialogues = (): DialogueNode[] => {
  return Array.from(dialogueByIndex.keys())
    .sort((a, b) => a - b)
    .map((index) => buildDialogueNode(index));
};
