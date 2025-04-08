import { ComponentValue } from '@mud-classic/recs';
import { NetworkComponentUpdate } from 'workers/types';

// represents a single state entry for a Component. entityIndex->value
export type StateEntry = Map<number, ComponentValue>;

// represents a mapping from an Entity ID to its Entity Index
export type IDIndexMap = Map<string, number>;

// a state update event (i.e. a component update sans tx metadata)
export type StateEvent = Omit<NetworkComponentUpdate, 'lastEventInTx' | 'txHash'>;
