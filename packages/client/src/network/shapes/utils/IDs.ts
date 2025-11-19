import { EntityID, EntityIndex, World } from 'engine/recs';
import { formatEntityID } from 'engine/utils';
import { ethers } from 'ethers';

const IDStore = new Map<string, string>();

export const getEntityByHash = (
  world: World,
  args: any[],
  argTypes: string[]
): EntityIndex | undefined => {
  const hash = hashArgs(args, argTypes) ?? '';
  if (!hash) return undefined;
  return world.entityToIndex.get(hash);
};

// get hashed ID without formatting or world check
export const hashArgs = (args: any[], argTypes: string[], skipFormat?: boolean): EntityID => {
  let invalidArgs = false;
  args.forEach((arg) => {
    if (arg === undefined || arg === null || arg === '') invalidArgs = true;
  });

  if (invalidArgs) {
    console.warn('hashArgs(): undefined arg', { argTypes, args });
    return '' as EntityID;
  }

  let id = '';
  const key = args.join('-');
  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = ethers.solidityPackedKeccak256(argTypes, args);
    // if (!skipFormat) id = formatEntityID(id); // no longer used, as all IDs are now formatted upon decoding via RECS
    id = formatEntityID(id);
    IDStore.set(key, id);
  }

  return id as EntityID;
};
