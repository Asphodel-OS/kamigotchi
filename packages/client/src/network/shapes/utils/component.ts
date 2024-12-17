import { EntityID, EntityIndex, getComponentValue } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';

export const getLevel = (components: Components, entity: EntityIndex, fallback = 0): number => {
  const { Level } = components;
  const result = getComponentValue(Level, entity)?.value;
  if (result === undefined) console.warn('getLevel(): undefined value for entity', entity);
  return (result ?? fallback) * 1;
};

export const getMediaURI = (components: Components, entity: EntityIndex): string => {
  const { MediaURI } = components;
  const result = getComponentValue(MediaURI, entity)?.value;
  if (result === undefined) console.warn('getMediaURI(): undefined value for entity', entity);
  return result ?? '';
};

export const getName = (components: Components, entity: EntityIndex): string => {
  const { Name } = components;
  const result = getComponentValue(Name, entity)?.value;
  if (result === undefined) console.warn('getName(): undefined value for entity', entity);
  return result ?? '';
};

export const getRerolls = (components: Components, entity: EntityIndex): number => {
  const { Reroll } = components;
  const result = getComponentValue(Reroll, entity)?.value;
  if (result === undefined) console.warn('getReroll(): undefined value for entity', entity);
  return (result ?? 0) * 1;
};

export const getSkillPoints = (components: Components, entity: EntityIndex): number => {
  const { SkillPoint } = components;
  const result = getComponentValue(SkillPoint, entity)?.value;
  if (result === undefined) console.warn('getSkillPoint(): undefined value for entity', entity);
  return (result ?? 0) * 1;
};

export const getState = (components: Components, entity: EntityIndex): string => {
  const { State } = components;
  const result = getComponentValue(State, entity)?.value;
  if (result === undefined) console.warn('getState(): undefined value for entity', entity);
  return result ?? '';
};

export const getType = (components: Components, entity: EntityIndex): string => {
  const { Type } = components;
  const result = getComponentValue(Type, entity)?.value;
  if (result === undefined) console.warn('getType(): undefined value for entity', entity);
  return result ?? '';
};

export const getValue = (components: Components, entity: EntityIndex): number => {
  const { Value } = components;
  const result = getComponentValue(Value, entity)?.value;
  // TODO: uncomment this once harvests default to 0 value
  // if (result === undefined) console.warn('getValue(): undefined value for entity', entity);
  return (result ?? 0) * 1;
};

////////////////
// ADDRESSES

export const getOwnerAddress = (components: Components, entity: EntityIndex): string => {
  const { OwnerAddress } = components;
  const result = getComponentValue(OwnerAddress, entity)?.value;
  if (result === undefined) console.warn('getOwnerAddress(): undefined value for entity', entity);
  return result ?? '';
};

export const getOperatorAddress = (components: Components, entity: EntityIndex): string => {
  const { OperatorAddress } = components;
  const result = getComponentValue(OperatorAddress, entity)?.value;
  if (result === undefined)
    console.warn('getOperatorAddress(): undefined value for entity', entity);
  return result ?? '';
};

////////////////
// IDS

export const getKamiOwnerID = (components: Components, entity: EntityIndex): EntityID => {
  const { OwnsKamiID } = components;
  const result = getComponentValue(OwnsKamiID, entity)?.value;
  if (result === undefined) console.warn('getOwnsKamiID(): undefined value for entity', entity);
  return formatEntityID(result ?? '');
};

export const getSourceID = (components: Components, entity: EntityIndex): EntityID => {
  const { SourceID } = components;
  const result = getComponentValue(SourceID, entity)?.value;
  if (result === undefined) console.warn('getSourceID(): undefined value for entity', entity);
  return formatEntityID(result ?? '');
};

export const getTargetID = (components: Components, entity: EntityIndex): EntityID => {
  const { TargetID } = components;
  const result = getComponentValue(TargetID, entity)?.value;
  if (result === undefined) console.warn('getTargetID(): undefined value for entity', entity);
  return formatEntityID(result ?? '');
};

/////////////////
// INDICES

export const getIndex = (components: Components, entity: EntityIndex): number => {
  const { Index } = components;
  const result = getComponentValue(Index, entity)?.value;
  if (result === undefined) console.warn('getIndex(): undefined value for entity', entity);
  return (result ?? 0) * 1;
};

export const getAccountIndex = (components: Components, entity: EntityIndex): number => {
  const { AccountIndex } = components;
  const result = getComponentValue(AccountIndex, entity)?.value;
  if (result === undefined) console.warn('getAccountIndex(): undefined value for entity', entity);
  return (result ?? 0) * 1;
};

export const getItemIndex = (components: Components, entity: EntityIndex): number => {
  const { ItemIndex } = components;
  const result = getComponentValue(ItemIndex, entity)?.value;
  if (result === undefined) console.warn('getItemIndex(): undefined value for entity', entity);
  return (result ?? 0) * 1;
};

export const getKamiIndex = (components: Components, entity: EntityIndex): number => {
  const { KamiIndex } = components;
  const result = getComponentValue(KamiIndex, entity)?.value;
  if (result === undefined) console.warn('getKamiIndex(): undefined value for entity', entity);
  return (result ?? 0) * 1;
};

export const getRoomIndex = (components: Components, entity: EntityIndex): number => {
  const { RoomIndex } = components;
  const result = getComponentValue(RoomIndex, entity)?.value;
  if (result === undefined) console.warn('getRoomIndex(): undefined value for entity', entity);
  return (result ?? 0) * 1;
};

/////////////////
// TIME

// get the last action time of an entity (cooldown reset)
export const getLastActionTime = (components: Components, entity: EntityIndex): number => {
  const { LastActionTime } = components;
  const result = getComponentValue(LastActionTime, entity)?.value;
  if (result === undefined) console.warn('getLastActionTime(): undefined value for entity', entity);
  return (result ?? 0) * 1;
};

// get the last time of an entity
export const getLastTime = (components: Components, entity: EntityIndex): number => {
  const { LastTime } = components;
  const result = getComponentValue(LastTime, entity)?.value;
  if (result === undefined) console.warn('getLastTime(): undefined value for entity', entity);
  return (result ?? 0) * 1;
};

export const getResetTime = (components: Components, entity: EntityIndex): number => {
  const { ResetTime } = components;
  const result = getComponentValue(ResetTime, entity)?.value;
  if (result === undefined) console.warn('getResetTime(): undefined value for entity', entity);
  return (result ?? 0) * 1;
};

export const getStartTime = (components: Components, entity: EntityIndex): number => {
  const { StartTime } = components;
  const result = getComponentValue(StartTime, entity)?.value;
  if (result === undefined) console.warn('getStartTime(): undefined value for entity', entity);
  return (result ?? 0) * 1;
};
