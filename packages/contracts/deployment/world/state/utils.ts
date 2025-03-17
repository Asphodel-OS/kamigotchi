import { parse } from 'csv-parse/sync';
import { BigNumberish, utils } from 'ethers';

////////////////
// CONSTANTS

export const MUSU_INDEX = 1;
export const GACHA_TICKET_INDEX = 10;
export const DataSheets = new Map<string, any>();

////////////////
// DATA SHEETS

// for the management of data sheets in singleton pattern
export const getSheet = async (category: string, name: string) => {
  const key = category + '-' + name;
  if (!DataSheets.has(key)) {
    const csv = await readFile(`${category}/${name}.csv`);
    DataSheets.set(key, csv);
  }
  return DataSheets.get(key);
};

export async function readFile(file: string) {
  const fs = require('fs');
  const path = require('path');
  const result = fs.readFileSync(path.join(__dirname, '../data/', file), 'utf8');
  return await parse(result, { columns: true });
}

///////////////
// GENERAL

export const toCreate = (entry: any): boolean => {
  return (
    entry['Status'] === 'Revise Deployment' ||
    entry['Status'] === 'Ingame' ||
    entry['Status'] === 'For Implementation'
  );
};

export const toDelete = (entry: any): boolean => {
  return entry['Status'] === 'Revise Deployment' || entry['Status'] === 'Ingame';
};

/// @dev check if entry should be revised. assume all entries that are valid should be revised
export const toRevise = (entry: any): boolean => {
  return (
    entry['Status'] === 'Revise Deployment' ||
    entry['Status'] === 'Ingame' ||
    entry['Status'] === 'For Implementation'
  );
};

///////////////
// GETTERS

export const getRegID = (index: number, type: string): string => {
  if (type === 'FACTION') return generateRegID('faction', index);
  else if (type === 'GOAL') return generateRegID('goal', index);
  else if (type === 'ITEM') return generateRegID('registry.item', index);
  else if (type === 'NPC') return generateRegID('NPC', index);
  else if (type === 'NODE') return generateRegID('node', index);
  else if (type === 'QUEST') return generateRegID('quest.instance', index);
  else if (type === 'ROOM') return generateRegID('room', index);
  else if (type === 'SKILL') return generateRegID('registry.skill', index);
  else return '';
};

export const getGoalID = (index: number) => {
  return generateRegID('goal', index);
};

export const generateRegID = (field: string, index: number) => {
  return utils.solidityKeccak256(['string', 'uint32'], [field, index]);
};

///////////////
// PROCESSORS

export const bringEntityToFront = (arr: any[], entityType: string) => {
  return arr.sort((a, b) => {
    if (a['Class'] === entityType && b['Class'] !== entityType) return -1;
    if (b['Class'] === entityType && a['Class'] !== entityType) return 1;
    return 0;
  });
};

export const textToNumberArray = (text: string): number[] => {
  text = text.replaceAll('[', '');
  text = text.replaceAll(']', '');
  return text.split(',').map((n) => Number(n.trim()));
};

// parses common human readable conditions into machine types for init
export const parseToInitCon = (
  logicType: string,
  type: string,
  index: number,
  value: BigNumberish
): { logicType: string; type: string; index: number; value: BigNumberish } => {
  return {
    logicType: logicType == '' ? '' : parseToLogicType(logicType),
    type: parseToConType(type),
    index: parseToConIndex(type, index),
    value: parseToConValue(type, index, value),
  };
};

export const getItemImage = (str: string): string => {
  let name = str.toLowerCase();
  name = name.replaceAll(/ /g, '_').replaceAll(/-/g, '_');
  name = name.replaceAll('(', '').replaceAll(')', '');
  return 'images/items/' + name + '.png';
};

export const parseKamiStateToIndex = (state: string): number => {
  if (state === 'RESTING') return 1;
  else if (state === 'HARVESTING') return 2;
  else if (state === 'DEAD') return 3;
  else if (state === '721_EXTERNAL') return 4;
  else return 0;
};

///////////////
// MISC

// a bit hardcoded
export function stringToNumberArray(rawStr: string): number[] {
  if (rawStr === '') return [];
  const len = rawStr.length;
  let str = rawStr;
  if (rawStr[0] === '[' && rawStr[len - 1] === ']') str = rawStr.slice(1, -1);
  return str.split(',').map((s) => Number(s.trim()));
}

///////////////
// INTERNAL

// parses common human readable words into machine types
const parseToLogicType = (str: string): string => {
  const is = ['IS', 'COMPLETE', 'AT'];
  const min = ['MIN', 'HAVE', 'GREATER'];
  const max = ['MAX', 'LESSER'];
  const equal = ['EQUAL'];
  const not = ['NOT'];

  if (is.includes(str)) return 'BOOL_IS';
  else if (min.includes(str)) return 'CURR_MIN';
  else if (max.includes(str)) return 'CURR_MAX';
  else if (equal.includes(str)) return 'CURR_EQUAL';
  else if (not.includes(str)) return 'BOOL_NOT';
  else {
    console.error('unrecognized logic type');
    return '';
  }
};

const parseToConType = (str: string): string => {
  if (str === 'GOAL') return 'COMPLETE_COMP';
  else return str.replace(/COIN|MINT20/g, 'ITEM');
};

const parseToConIndex = (type: string, index: number): number => {
  // coins are items, use MUSU index
  if (type.includes('COIN')) return MUSU_INDEX;
  else if (type.includes('MINT20')) return GACHA_TICKET_INDEX;
  else if (type === 'GOAL') return 0;
  else return index;
};

const parseToConValue = (type: string, index: number, value: BigNumberish): BigNumberish => {
  if (type === 'GOAL') return getGoalID(index);
  else return value;
};
