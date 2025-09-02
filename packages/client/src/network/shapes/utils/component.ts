import { EntityID, EntityIndex, getComponentValue } from '@mud-classic/recs';
import { BigNumber } from 'ethers';
import { Address } from 'viem';

import { Affinity } from 'constants/affinities';
import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { parseAddress } from 'utils/address';

export const getAffinity = (comps: Components, entity: EntityIndex): Affinity => {
  const { Affinity } = comps;
  const result = getComponentValue(Affinity, entity)?.value;
  if (result === undefined) console.warn('getAffinity(): undefined for entity', entity);
  return (result ?? 'NORMAL') as Affinity;
};

export const getBalance = (comps: Components, entity: EntityIndex, debug = true): number => {
  const { Balance } = comps;
  const result = getComponentValue(Balance, entity)?.value;
  if (debug && result === undefined) console.warn('getBalance(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getCost = (comps: Components, entity: EntityIndex): number => {
  const { Cost } = comps;
  const result = getComponentValue(Cost, entity)?.value;
  if (result === undefined) console.warn('getCost(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getDecay = (comps: Components, entity: EntityIndex, precision = 6): number => {
  const { Decay } = comps;
  const result = getComponentValue(Decay, entity)?.value;
  if (result === undefined) console.warn('getDecay(): undefined for entity', entity);
  return ((result ?? 0) * 1.0) / 10 ** precision;
};

export const getDescription = (comps: Components, entity: EntityIndex): string => {
  const { Description } = comps;
  const result = getComponentValue(Description, entity)?.value;
  if (result === undefined) console.warn('getDescription(): undefined for entity', entity);
  return result ?? '';
};

export const getEntityType = (comps: Components, entity: EntityIndex): string => {
  const { EntityType } = comps;
  const result = getComponentValue(EntityType, entity)?.value;
  if (result === undefined) console.warn('getEntityType(): undefined for entity', entity);
  return result ?? '';
};

export const getExperience = (
  comps: Components,
  entity: EntityIndex,
  fallback = 0,
  debug = true
): number => {
  const { Experience } = comps;
  const result = getComponentValue(Experience, entity)?.value;
  if (debug && result === undefined) console.warn('getExperience(): undefined for entity', entity);
  return (result ?? fallback) * 1;
};

export const getFor = (comps: Components, entity: EntityIndex): string => {
  const { For } = comps;
  const rawValue = getComponentValue(For, entity)?.value as string | '';
  // for can be empty
  return rawValue;
};

export const getLevel = (comps: Components, entity: EntityIndex, fallback = 0): number => {
  const { Level } = comps;
  const result = getComponentValue(Level, entity)?.value;
  if (result === undefined && !fallback) console.warn('getLevel(): undefined for entity', entity);
  return (result ?? fallback) * 1;
};

export const getMax = (comps: Components, entity: EntityIndex): number => {
  const { Max } = comps;
  const result = getComponentValue(Max, entity)?.value;
  if (result === undefined) console.warn('getMax(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getMediaURI = (comps: Components, entity: EntityIndex): string => {
  const { MediaURI } = comps;
  const result = getComponentValue(MediaURI, entity)?.value;
  if (result === undefined) console.warn('getMediaURI(): undefined for entity', entity);
  return result ?? '';
};

export const getName = (comps: Components, entity: EntityIndex): string => {
  const { Name } = comps;
  const result = getComponentValue(Name, entity)?.value;
  if (result === undefined) console.warn('getName(): undefined for entity', entity);
  return result ?? '';
};

export const getPeriod = (comps: Components, entity: EntityIndex): number => {
  const { Period } = comps;
  const result = getComponentValue(Period, entity)?.value;
  if (result === undefined) console.warn('getPeriod(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getRarity = (comps: Components, entity: EntityIndex, debug = false): number => {
  const { Rarity } = comps;
  const result = getComponentValue(Rarity, entity)?.value;
  if (debug && result === undefined) console.warn('getRarity(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getRate = (comps: Components, entity: EntityIndex, precision = 0): number => {
  const { Rate } = comps;
  const result = getComponentValue(Rate, entity)?.value;
  if (result === undefined) console.warn('getRate(): undefined for entity', entity);
  return ((result ?? 0) * 1.0) / 10 ** precision;
};

export const getRerolls = (comps: Components, entity: EntityIndex): number => {
  const { Reroll } = comps;
  const result = getComponentValue(Reroll, entity)?.value;
  // if (result === undefined) console.warn('getRerolls(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

// assume scale is always defined with 3 decimals
export const getScale = (comps: Components, entity: EntityIndex, precision = 3): number => {
  const { Scale } = comps;
  const result = getComponentValue(Scale, entity)?.value;
  if (result === undefined) console.warn('getScale(): undefined for entity', entity);
  return ((result ?? 0) * 1.0) / 10 ** precision;
};

export const getSkillPoints = (comps: Components, entity: EntityIndex): number => {
  const { SkillPoint } = comps;
  const result = getComponentValue(SkillPoint, entity)?.value;
  if (result === undefined) console.warn('getSkillPoint(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getState = (comps: Components, entity: EntityIndex): string => {
  const { State } = comps;
  const result = getComponentValue(State, entity)?.value;
  if (result === undefined) console.warn('getState(): undefined for entity', entity);
  return result ?? '';
};

export const getType = (comps: Components, entity: EntityIndex): string => {
  const { Type } = comps;
  const result = getComponentValue(Type, entity)?.value;
  if (result === undefined) console.warn('getType(): undefined for entity', entity);
  return result ?? '';
};

export const getValue = (comps: Components, entity: EntityIndex): number => {
  const { Value } = comps;
  const result = getComponentValue(Value, entity)?.value ?? 0;
  try {
    // convert if meant to be negative
    const raw = BigNumber.from(result);
    return raw.fromTwos(256).toNumber(); // throws if out of bounds
  } catch {
    // return raw form otherwise - used for raw uint256 handling
    return result;
  }
};

/////////////////
// FLAGS

export const getHasFlag = (comps: Components, entity: EntityIndex, flag: number): boolean => {
  const { HasFlag } = comps;
  const result = getComponentValue(HasFlag, entity)?.value;
  return result ?? false;
};

export const getIsComplete = (comps: Components, entity: EntityIndex): boolean => {
  const { IsComplete } = comps;
  const result = getComponentValue(IsComplete, entity)?.value;
  return result ?? false;
};

export const getIsRegistry = (comps: Components, entity: EntityIndex): boolean => {
  const { IsRegistry } = comps;
  const result = getComponentValue(IsRegistry, entity)?.value;
  return result ?? false;
};

/////////////////
// ARRAYS

export const getKeys = (comps: Components, entity: EntityIndex): number[] => {
  const { Keys } = comps;
  const results = getComponentValue(Keys, entity)?.value;
  if (results === undefined) {
    console.warn('getKeys(): undefined for entity', entity);
    return [];
  }
  return results.map((result) => result * 1);
};

export const getValues = (comps: Components, entity: EntityIndex): number[] => {
  const { Values } = comps;
  const results = getComponentValue(Values, entity)?.value;
  if (results === undefined) {
    console.warn('getValues(): undefined for entity', entity);
    return [];
  }
  return results.map((result) => result * 1);
};

export const getWeights = (comps: Components, entity: EntityIndex): number[] => {
  const { Weights } = comps;
  const results = getComponentValue(Weights, entity)?.value;
  if (results === undefined) {
    console.warn('getWeights(): undefined for entity', entity);
    return [];
  }

  return results.map((result) => result * 1);
};

////////////////
// ADDRESSES

// TODO: we should typecast the values of the XXAddress comps
// with some string validation 0x{40 chars} during decoding/unpacking

// get an owner address
export const getOwnerAddress = (comps: Components, entity: EntityIndex): Address => {
  const { OwnerAddress } = comps;
  const result = getComponentValue(OwnerAddress, entity)?.value;
  if (result === undefined) {
    console.warn(`getOwnerAddress(): undefined for entity ${entity}`);
    return '0x000000000000000000000000000000000000dEaD';
  }

  return parseAddress(result);
};

// get an operator address
export const getOperatorAddress = (comps: Components, entity: EntityIndex): Address => {
  const { OperatorAddress } = comps;
  const result = getComponentValue(OperatorAddress, entity)?.value;
  if (result === undefined) {
    console.warn(`getOperatorAddress(): undefined for entity ${entity}`);
    return '0x000000000000000000000000000000000000dEaD';
  }

  return parseAddress(result);
};

export const getTokenAddress = (comps: Components, entity: EntityIndex): Address => {
  const { TokenAddress } = comps;
  const result = getComponentValue(TokenAddress, entity)?.value;
  if (result === undefined) {
    console.warn(`getTokenAddress(): undefined for entity ${entity}`);
    return '0x000000000000000000000000000000000000dEaD';
  }

  return parseAddress(result);
};

////////////////
// IDS

export const getHolderID = (comps: Components, entity: EntityIndex): EntityID => {
  const { HolderID } = comps;
  const result = getComponentValue(HolderID, entity)?.value;
  if (result === undefined) console.warn('getHolderID(): undefined for entity', entity);
  return formatEntityID(result ?? '');
};

export const getKamiOwnerID = (comps: Components, entity: EntityIndex): EntityID => {
  const { OwnsKamiID } = comps;
  const result = getComponentValue(OwnsKamiID, entity)?.value;
  if (result === undefined) console.warn('getOwnsKamiID(): undefined for entity', entity);
  return formatEntityID(result ?? '');
};

export const getSourceID = (comps: Components, entity: EntityIndex): EntityID => {
  const { SourceID } = comps;
  const result = getComponentValue(SourceID, entity)?.value;
  if (result === undefined) console.warn('getSourceID(): undefined for entity', entity);
  return formatEntityID(result ?? '');
};

export const getTargetID = (comps: Components, entity: EntityIndex, debug = true): EntityID => {
  const { TargetID } = comps;
  const result = getComponentValue(TargetID, entity)?.value;
  if (debug && result === undefined) console.warn('getTargetID(): undefined for entity', entity);
  return formatEntityID(result ?? '');
};

export const getOwnsTradeID = (comps: Components, entity: EntityIndex): EntityID => {
  const { OwnsTradeID } = comps;
  const result = getComponentValue(OwnsTradeID, entity)?.value;
  if (result === undefined) console.warn('getOwnsTradeID(): undefined for entity', entity);
  return formatEntityID(result ?? '');
};

/////////////////
// INDICES

export const getIndex = (comps: Components, entity: EntityIndex): number => {
  const { Index } = comps;
  const result = getComponentValue(Index, entity)?.value;
  if (result === undefined) console.warn('getIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getAccountIndex = (comps: Components, entity: EntityIndex): number => {
  const { AccountIndex } = comps;
  const result = getComponentValue(AccountIndex, entity)?.value;
  if (result === undefined) console.warn('getAccountIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getCurrencyIndex = (comps: Components, entity: EntityIndex): number => {
  const { CurrencyIndex } = comps;
  const result = getComponentValue(CurrencyIndex, entity)?.value;
  if (result === undefined) console.warn('getCurrencyIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getItemIndex = (comps: Components, entity: EntityIndex): number => {
  const { ItemIndex } = comps;
  const result = getComponentValue(ItemIndex, entity)?.value;
  if (result === undefined) console.warn('getItemIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getKamiIndex = (comps: Components, entity: EntityIndex): number => {
  const { KamiIndex } = comps;
  const result = getComponentValue(KamiIndex, entity)?.value;
  if (result === undefined) console.warn('getKamiIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getNPCIndex = (comps: Components, entity: EntityIndex): number => {
  const { NPCIndex } = comps;
  const result = getComponentValue(NPCIndex, entity)?.value;
  if (result === undefined) console.warn('getNPCIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getRoomIndex = (comps: Components, entity: EntityIndex): number => {
  const { RoomIndex } = comps;
  const result = getComponentValue(RoomIndex, entity)?.value;
  if (result === undefined) console.warn('getRoomIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getSkillIndex = (comps: Components, entity: EntityIndex): number => {
  const { SkillIndex } = comps;
  const result = getComponentValue(SkillIndex, entity)?.value;
  if (result === undefined) console.warn('getSkillIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

/////////////////
// TIME

// get the last action time of an entity (cooldown reset)
export const getLastActionTime = (
  comps: Components,
  entity: EntityIndex,
  debug?: boolean
): number => {
  const { LastActionTime } = comps;
  const result = getComponentValue(LastActionTime, entity)?.value;
  if (debug && result === undefined)
    console.warn('getLastActionTime(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

// get the last time of an entity
export const getLastTime = (comps: Components, entity: EntityIndex, debug = false): number => {
  const { LastTime } = comps;
  const result = getComponentValue(LastTime, entity)?.value;
  if (debug && result === undefined) console.warn('getLastTime(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getNextTime = (comps: Components, entity: EntityIndex, debug = false): number => {
  const { NextTime } = comps;
  const result = getComponentValue(NextTime, entity)?.value;
  if (debug && result === undefined) console.warn('getNextTime(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getResetTime = (comps: Components, entity: EntityIndex): number => {
  const { ResetTime } = comps;
  const result = getComponentValue(ResetTime, entity)?.value;
  if (result === undefined) console.warn('getResetTime(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getStartTime = (comps: Components, entity: EntityIndex, debug = false): number => {
  const { StartTime } = comps;
  const result = getComponentValue(StartTime, entity)?.value;
  if (debug && result === undefined) console.warn('getStartTime(): undefined for entity', entity);
  return (result ?? 0) * 1;
};
