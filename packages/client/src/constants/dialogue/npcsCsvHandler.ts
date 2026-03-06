import { triggerKamiAdoptionAgencyModal, triggerTempleOfTheWheelModal } from 'app/triggers';
import { NpcImages } from 'assets/images/npcs';
import dialoguesCsv from './data/npcDialogues.csv';
import npcsCsv from './data/npcs.csv';
import { DialogueNode } from './types';

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

///////////////
// PREPARATION

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

const npcByIndex = new Map<number, NonNullable<DialogueNode['npc']>>();
const npcIndexByName = new Map<string, number>();
const dialogueByIndex = new Map<number, DialogueData>();

///////////////
// HELPERS

const normalizeKey = (key: string) =>
  key
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const normalizeRow = (row: CsvRow) => {
  const normalizedRow = new Map<string, string>();
  Object.entries(row).forEach(([key, value]) => {
    normalizedRow.set(normalizeKey(key), value);
  });
  return normalizedRow;
};

const getField = (row: Map<string, string>, keys: string[]) => {
  for (const key of keys) {
    const value = row.get(normalizeKey(key));
    if (value !== undefined) return value;
  }
  return undefined;
};

const indexParser = (raw?: string) => {
  if (!raw?.trim()) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const resolveImage = (raw?: string) => {
  const key = raw?.trim();
  if (!key) return '';
  const basename = key.split('/').pop() ?? key;
  const corrected = basename.endsWith('_png') ? `${basename.slice(0, -4)}.png` : basename;
  const normalized = corrected.includes('.') ? corrected : `${corrected}.png`;
  return NpcImages[normalized] ?? '';
};

///////////////
// LOADERS

const loadNpcs = () => {
  npcsCsv.forEach((rawRow: CsvRow) => {
    const row = normalizeRow(rawRow);
    const index = indexParser(getField(row, ['index']));
    if (index === undefined) return;

    const name = getField(row, ['name'])?.trim() ?? '';
    const img = resolveImage(getField(row, ['default image', 'image']));
    const color = getField(row, ['text color', 'color'])?.trim() || undefined;
    const ritualName = getField(row, ['ritual', 'rituals'])?.trim();
    const special = ritualName ? ritualMap[ritualName] : undefined;
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

const loadDialogues = () => {
  dialoguesCsv.forEach((rawRow: CsvRow) => {
    const row = normalizeRow(rawRow);
    const index = indexParser(getField(row, ['index']));
    if (index === undefined) return;

    const npcRef = getField(row, ['npcIndex', 'npc index', 'npc'])?.trim();
    const numericNpcIndex = indexParser(npcRef);
    const npcIndex =
      numericNpcIndex ??
      (npcRef ? npcIndexByName.get(npcRef.toLowerCase().replace(/\s+/g, ' ').trim()) : undefined);
    const mood = resolveImage(getField(row, ['mood'])) || undefined;
    const text = getField(row, ['text']) ?? '';
    const nextDialogue = indexParser(getField(row, ['nextDialogue', 'next dialogue']));
    const choiceDialogueIndices = (getField(row, ['choice']) ?? '')
      .split(',')
      .map((value) => indexParser(value.trim()))
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

///////////////
// BUILDERS

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
    const label = choiceRow.text;
    if (!label) return;
    next.set(label, choiceRow.nextDialogue);
  });

  return {
    index,
    text: [row.text],
    npc,
    next: next.size > 0 ? next : undefined,
  };
};

///////////////
// INITIALIZATION

loadNpcs();
loadDialogues();

///////////////
// EXPORTS

export const getNpcDialogueByIndex = (index: number): DialogueNode => buildDialogueNode(index);

export const getAllNpcDialogues = (): DialogueNode[] => {
  return Array.from(dialogueByIndex.keys())
    .sort((a, b) => a - b)
    .map((index) => buildDialogueNode(index));
};
