import { EntityID, EntityIndex, getComponentValue } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';

export const getBalance = (components: Components, entity: EntityIndex): number => {
  const { Value } = components;
  return (getComponentValue(Value, entity)?.value ?? 0) * 1;
};

export const getRerolls = (components: Components, entity: EntityIndex): number => {
  const { Reroll } = components;
  return (getComponentValue(Reroll, entity)?.value ?? 0) * 1;
};

export const getSkillPoints = (components: Components, entity: EntityIndex): number => {
  const { SkillPoint } = components;
  return (getComponentValue(SkillPoint, entity)?.value ?? 0) * 1;
};

export const getState = (components: Components, entity: EntityIndex): string => {
  const { State } = components;
  return getComponentValue(State, entity)?.value ?? '';
};

////////////////
// ADDRESSES

export const getOwnerAddress = (components: Components, entity: EntityIndex): string => {
  const { OwnerAddress } = components;
  return getComponentValue(OwnerAddress, entity)?.value ?? '';
};

export const getOperatorAddress = (components: Components, entity: EntityIndex): string => {
  const { OperatorAddress } = components;
  return getComponentValue(OperatorAddress, entity)?.value ?? '';
};

////////////////
// IDS

export const getKamiOwnerID = (components: Components, entity: EntityIndex): EntityID => {
  const { OwnsKamiID } = components;
  const rawID = getComponentValue(OwnsKamiID, entity)?.value ?? '';
  return formatEntityID(rawID);
};

export const getSourceID = (components: Components, entity: EntityIndex): EntityID => {
  const { SourceID } = components;
  const rawID = getComponentValue(SourceID, entity)?.value ?? '';
  return formatEntityID(rawID);
};

export const getTargetID = (components: Components, entity: EntityIndex): EntityID => {
  const { TargetID } = components;
  const rawID = getComponentValue(TargetID, entity)?.value ?? '';
  return formatEntityID(rawID);
};

/////////////////
// INDICES

export const getAccountIndex = (components: Components, entity: EntityIndex): number => {
  const { AccountIndex } = components;
  return (getComponentValue(AccountIndex, entity)?.value ?? 0) * 1;
};

export const getRoomIndex = (components: Components, entity: EntityIndex): number => {
  const { RoomIndex } = components;
  return (getComponentValue(RoomIndex, entity)?.value ?? 0) * 1;
};

/////////////////
// TIME

// get the last action time of an entity (cooldown reset)
export const getLastActionTime = (components: Components, entity: EntityIndex): number => {
  const { LastActionTime } = components;
  return (getComponentValue(LastActionTime, entity)?.value ?? 0) * 1;
};

// get the last time of an entity
export const getLastTime = (components: Components, entity: EntityIndex): number => {
  const { LastTime } = components;
  return (getComponentValue(LastTime, entity)?.value ?? 0) * 1;
};

export const getResetTime = (components: Components, entity: EntityIndex): number => {
  const { ResetTime } = components;
  return (getComponentValue(ResetTime, entity)?.value ?? 0) * 1;
};

export const getStartTime = (components: Components, entity: EntityIndex): number => {
  const { StartTime } = components;
  return (getComponentValue(StartTime, entity)?.value ?? 0) * 1;
};
