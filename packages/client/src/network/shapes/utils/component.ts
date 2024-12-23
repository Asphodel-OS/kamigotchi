import { EntityID, EntityIndex, getComponentValue } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';

export const getCost = (components: Components, entity: EntityIndex): number => {
  const { Cost } = components;
  const result = getComponentValue(Cost, entity)?.value;
  if (result === undefined) console.warn('getCost(): undefined for entity', entity);
  return result ?? 0;
};

export const getDescription = (components: Components, entity: EntityIndex): string => {
  const { Description } = components;
  const result = getComponentValue(Description, entity)?.value;
  if (result === undefined) console.warn('getDescription(): undefined for entity', entity);
  return result ?? '';
};

export const getLevel = (components: Components, entity: EntityIndex, fallback = 0): number => {
  const { Level } = components;
  const result = getComponentValue(Level, entity)?.value;
  if (result === undefined) console.warn('getLevel(): undefined for entity', entity);
  return (result ?? fallback) * 1;
};

export const getMax = (components: Components, entity: EntityIndex): number => {
  const { Max } = components;
  const result = getComponentValue(Max, entity)?.value;
  if (result === undefined) console.warn('getMax(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getMediaURI = (components: Components, entity: EntityIndex): string => {
  const { MediaURI } = components;
  const result = getComponentValue(MediaURI, entity)?.value;
  if (result === undefined) console.warn('getMediaURI(): undefined for entity', entity);
  return result ?? '';
};

export const getName = (components: Components, entity: EntityIndex): string => {
  const { Name } = components;
  const result = getComponentValue(Name, entity)?.value;
  if (result === undefined) console.warn('getName(): undefined for entity', entity);
  return result ?? '';
};

export const getRerolls = (components: Components, entity: EntityIndex): number => {
  const { Reroll } = components;
  const result = getComponentValue(Reroll, entity)?.value;
  if (result === undefined) console.warn('getReroll(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getSkillPoints = (components: Components, entity: EntityIndex): number => {
  const { SkillPoint } = components;
  const result = getComponentValue(SkillPoint, entity)?.value;
  if (result === undefined) console.warn('getSkillPoint(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getState = (components: Components, entity: EntityIndex): string => {
  const { State } = components;
  const result = getComponentValue(State, entity)?.value;
  if (result === undefined) console.warn('getState(): undefined for entity', entity);
  return result ?? '';
};

export const getType = (components: Components, entity: EntityIndex): string => {
  const { Type } = components;
  const result = getComponentValue(Type, entity)?.value;
  if (result === undefined) console.warn('getType(): undefined for entity', entity);
  return result ?? '';
};

export const getValue = (components: Components, entity: EntityIndex): number => {
  const { Value } = components;
  const result = getComponentValue(Value, entity)?.value;
  // TODO: uncomment this once harvests default to 0 value
  // if (result === undefined) console.warn('getValue(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

////////////////
// ARRAYS

export const getKeys = (components: Components, entity: EntityIndex): number[] => {
  const { Keys } = components;
  const result = getComponentValue(Keys, entity)?.value;
  if (result === undefined) console.warn('getKeys(): undefined for entity', entity);
  return result ?? [];
};

export const getValues = (components: Components, entity: EntityIndex): number[] => {
  const { Values } = components;
  const result = getComponentValue(Values, entity)?.value;
  if (result === undefined) console.warn('getValues(): undefined for entity', entity);
  return result ?? [];
};

export const getWeights = (components: Components, entity: EntityIndex): number[] => {
  const { Weights } = components;
  const result = getComponentValue(Weights, entity)?.value;
  if (result === undefined) console.warn('getWeights(): undefined for entity', entity);
  return result ?? [];
};

////////////////
// ADDRESSES

export const getOwnerAddress = (components: Components, entity: EntityIndex): string => {
  const { OwnerAddress } = components;
  const result = getComponentValue(OwnerAddress, entity)?.value;
  if (result === undefined) console.warn('getOwnerAddress(): undefined for entity', entity);
  return result ?? '';
};

export const getOperatorAddress = (components: Components, entity: EntityIndex): string => {
  const { OperatorAddress } = components;
  const result = getComponentValue(OperatorAddress, entity)?.value;
  if (result === undefined) console.warn('getOperatorAddress(): undefined for entity', entity);
  return result ?? '';
};

////////////////
// IDS

export const getKamiOwnerID = (components: Components, entity: EntityIndex): EntityID => {
  const { OwnsKamiID } = components;
  const result = getComponentValue(OwnsKamiID, entity)?.value;
  if (result === undefined) console.warn('getOwnsKamiID(): undefined for entity', entity);
  return formatEntityID(result ?? '');
};

export const getSourceID = (components: Components, entity: EntityIndex): EntityID => {
  const { SourceID } = components;
  const result = getComponentValue(SourceID, entity)?.value;
  if (result === undefined) console.warn('getSourceID(): undefined for entity', entity);
  return formatEntityID(result ?? '');
};

export const getTargetID = (components: Components, entity: EntityIndex): EntityID => {
  const { TargetID } = components;
  const result = getComponentValue(TargetID, entity)?.value;
  if (result === undefined) console.warn('getTargetID(): undefined for entity', entity);
  return formatEntityID(result ?? '');
};

/////////////////
// INDICES

export const getIndex = (components: Components, entity: EntityIndex): number => {
  const { Index } = components;
  const result = getComponentValue(Index, entity)?.value;
  if (result === undefined) console.warn('getIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getAccountIndex = (components: Components, entity: EntityIndex): number => {
  const { AccountIndex } = components;
  const result = getComponentValue(AccountIndex, entity)?.value;
  if (result === undefined) console.warn('getAccountIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getItemIndex = (components: Components, entity: EntityIndex): number => {
  const { ItemIndex } = components;
  const result = getComponentValue(ItemIndex, entity)?.value;
  if (result === undefined) console.warn('getItemIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getKamiIndex = (components: Components, entity: EntityIndex): number => {
  const { KamiIndex } = components;
  const result = getComponentValue(KamiIndex, entity)?.value;
  if (result === undefined) console.warn('getKamiIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getRoomIndex = (components: Components, entity: EntityIndex): number => {
  const { RoomIndex } = components;
  const result = getComponentValue(RoomIndex, entity)?.value;
  if (result === undefined) console.warn('getRoomIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getSkillIndex = (components: Components, entity: EntityIndex): number => {
  const { SkillIndex } = components;
  const result = getComponentValue(SkillIndex, entity)?.value;
  if (result === undefined) console.warn('getSkillIndex(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

/////////////////
// TIME

// get the last action time of an entity (cooldown reset)
export const getLastActionTime = (components: Components, entity: EntityIndex): number => {
  const { LastActionTime } = components;
  const result = getComponentValue(LastActionTime, entity)?.value;
  if (result === undefined) console.warn('getLastActionTime(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

// get the last time of an entity
export const getLastTime = (components: Components, entity: EntityIndex): number => {
  const { LastTime } = components;
  const result = getComponentValue(LastTime, entity)?.value;
  if (result === undefined) console.warn('getLastTime(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getResetTime = (components: Components, entity: EntityIndex): number => {
  const { ResetTime } = components;
  const result = getComponentValue(ResetTime, entity)?.value;
  if (result === undefined) console.warn('getResetTime(): undefined for entity', entity);
  return (result ?? 0) * 1;
};

export const getStartTime = (components: Components, entity: EntityIndex): number => {
  const { StartTime } = components;
  const result = getComponentValue(StartTime, entity)?.value;
  if (result === undefined) console.warn('getStartTime(): undefined for entity', entity);
  return (result ?? 0) * 1;
};
