import { EntityID, EntityIndex, World } from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { utils } from 'ethers';

const IDStore = new Map<string, string>();

export const getEntityByHash = (
  world: World,
  args: any[],
  argTypes: string[]
): EntityIndex | undefined => {
  for (let i = 0; i < args.length; i++) if (args[i] === undefined) return;
  return world.entityToIndex.get(hashArgs(args, argTypes));
};

// get hashed ID without formatting or world check
export const hashArgs = (args: any[], argTypes: string[], skipFormat?: boolean): EntityID => {
  let id = '';
  const key = args.join('-');

  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = utils.solidityKeccak256(argTypes, args);
    if (!skipFormat) id = formatEntityID(id);
    IDStore.set(key, id);
  }

  return id as EntityID;
};
