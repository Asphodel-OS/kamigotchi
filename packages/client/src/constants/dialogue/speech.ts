import { getNpcPfp } from './npcPfp';
import { getNpcByName } from './npcsCsvHandler';
import { DialogueNode } from './types';

type Npc = NonNullable<DialogueNode['npc']>;

export type SpeechLine = { speaker?: string; npc?: Npc; pfp?: string; text: string };
export type SpeechGroup = SpeechLine & { lines: { text: string; index: number }[] };

const SPEAKER_TAG = /^([A-Za-z][A-Za-z0-9 .'-]{0,23}):\s*(.+)$/;
const WRAPPING_QUOTES = /^[“"]|[”"]$/g;

// "NAME: “line”" -> speaker + unquoted line; a tag counts if it is a known npc or ALL CAPS
export const parseSpeechLine = (raw: string): SpeechLine => {
  const match = raw.match(SPEAKER_TAG);
  if (!match) return { text: raw };
  const [, tag, rest] = match;
  const npc = getNpcByName(tag);
  if (!npc && tag !== tag.toUpperCase()) return { text: raw };
  return {
    speaker: npc?.name ?? tag,
    npc,
    pfp: npc ? (getNpcPfp(npc.name) ?? npc.img) : undefined,
    text: rest.replace(WRAPPING_QUOTES, ''),
  };
};

export const parseSpeech = (text: string): SpeechLine[] =>
  text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseSpeechLine);

// consecutive lines from the same speaker share one card
export const groupSpeech = (lines: SpeechLine[]): SpeechGroup[] => {
  const groups: SpeechGroup[] = [];
  lines.forEach((line, index) => {
    const last = groups[groups.length - 1];
    const entry = { text: line.text, index };
    if (last && last.speaker === line.speaker) last.lines.push(entry);
    else groups.push({ ...line, lines: [entry] });
  });
  return groups;
};
