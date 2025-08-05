import { World } from '@mud-classic/recs';
import moment from 'moment';

import { getRoomByIndex } from 'app/cache/room';
import { MUSU_INDEX } from 'constants/items';
import { Components } from 'network/';
import { getPhaseName } from 'utils/time';
import { Condition } from '../Conditional';
import { getQuestByIndex } from '../Quest';
import { getFromDescription, parseKamiStateFromIndex } from '../utils';

export const parseConditionalUnits = (con: Condition): [string, string] => {
  let tar = ((con.target.value ?? 0) * 1).toString();
  let curr = ((con.status?.current ?? 0) * 1).toString();

  if (con.target.type.includes('TIME')) {
    tar = moment.duration((con.target.value ?? 0) * 1000).humanize();
    curr = moment.duration((con.status?.current ?? 0) * 1000).humanize();
  } else if (con.target.type.includes('ITEM') && con.target.index === MUSU_INDEX) {
    tar = tar + ' MUSU';
    curr = curr + ' MUSU';
  } else if (con.target.type === 'STATE' || con.target.type === 'KAMI_CAN_EAT') {
    const targetIndex = con.target.index ?? 0;
    const currentIndex = con.status?.current ?? 0;
    tar = parseKamiStateFromIndex(targetIndex) ?? `State ${targetIndex}`;
    curr = parseKamiStateFromIndex(currentIndex) ?? `State ${currentIndex}`;
  }

  return [tar, curr];
};
const HIDE_PROGRESS_TYPES = ['QUEST', 'ROOM', 'ITEM_BURN'];
export const parseConditionalTracking = (con: any): string => {
  const [tar, curr] = parseConditionalUnits(con);

  if (con.status?.completable) return ` ✓`;
  const hideProgress = HIDE_PROGRESS_TYPES.includes(con.target.type);
  return hideProgress ? '' : ` [${curr}/${tar}]`;
};

// converts machine condition text to something more human readable
// mostly meant for accounts nowm with some kami support
export const parseConditionalText = (
  world: World,
  components: Components,
  con: Condition,
  tracking?: boolean
): string => {
  const [targetVal, currVal] = parseConditionalUnits(con);
  const deltaText = parseDeltaText(con);

  let text = '';

  // account and general text
  if (con.target.type == 'ITEM')
    text = `${targetVal} ${getFromDescription(world, components, con.target.type, con.target.index!).name}`;
  else if (con.target.type == 'HARVEST_TIME') text = `Harvest for ${deltaText} ${targetVal}`;
  else if (con.target.type == 'LIQUIDATE_TOTAL') text = `Liquidate ${deltaText} ${targetVal} Kami`;
  else if (con.target.type == 'LIQUIDATED_VICTIM')
    text = `Been liquidated ${deltaText} ${targetVal} times`;
  else if (con.target.type == 'KAMI_LEVEL_HIGHEST')
    text = `Have a Kami of ${deltaText} ${targetVal}`;
  else if (con.target.type == 'KAMI') text = `Have ${deltaText} ${targetVal} Kami`;
  else if (con.target.type == 'QUEST')
    text = `Complete Quest [${getQuestByIndex(world, components, con.target.index!)?.name || `Quest ${targetVal}`}]`;
  else if (con.target.type == 'QUEST_REPEATABLE_COMPLETE')
    text = `Complete ${deltaText} ${targetVal} daily quests`;
  else if (con.target.type == 'ROOM')
    text = `At ${getRoomByIndex(world, components, con.target.index!)?.name || `Room ${targetVal}`}`;
  else if (con.target.type == 'COMPLETE_COMP')
    text = 'Gate at Scrap Paths unlocked'; // hardcoded - only goals use this. change in future
  else if (con.target.type == 'REPUTATION')
    text = `Have ${deltaText} ${targetVal} Reputation Points`;
  else if (con.target.type == 'PHASE') text = `During ${getPhaseName(con.target.index!)}`;
  else if (con.target.type == 'LEVEL') text = `Be ${deltaText} level ${targetVal}`;
  else if (con.target.type === 'STATE' || con.target.type === 'KAMI_CAN_EAT')
    text = `Be in ${deltaText} ${targetVal} state`;
  else text = '???';

  // kami specific text
  if (con.for && con.for == 'KAMI') {
    if (con.target.type == 'LEVEL') text = `${deltaText} level ${targetVal} kami`;
  }

  // tracking
  if (tracking) text += parseConditionalTracking(con);

  return text;
};

const parseDeltaText = (con: Condition): string => {
  if (con.logic.includes('MIN')) return `minimum`;
  else if (con.logic.includes('MAX')) return `maximum`;
  else if (con.logic.includes('EQUAL')) return `exactly`;
  else return '';
};
