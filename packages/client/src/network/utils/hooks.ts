import { useInterwovenKit } from '@initia/interwovenkit-react';
import {
  Component,
  defineQuery,
  EntityIndex,
  EntityQueryFragment,
  getComponentEntities,
  Schema,
  toUpdate,
} from 'engine/recs';
import { ObservableSet } from 'mobx';
import { useEffect, useMemo, useState } from 'react';
import { filter, Observable } from 'rxjs';

/** @deprecated Use hooks exported from @mud-classic/react package instead. */
export function useStream<T>(stream: Observable<T>, defaultValue?: T) {
  const [state, setState] = useState<T | undefined>(defaultValue);

  useEffect(() => {
    const sub = stream.subscribe((newState) => setState(newState));
    return () => sub?.unsubscribe();
  }, []);

  return state;
}

/** @deprecated Use hooks exported from @mud-classic/react package instead. */
export function useComponentValueStream<T extends Schema>(
  component: Component<T>,
  entity?: EntityIndex
) {
  const stream = useMemo(() => {
    if (entity != null) return component.update$.pipe(filter((update) => update.entity === entity));
    return component.update$.asObservable();
  }, [component, entity]);

  const update = useStream(stream, entity != null ? toUpdate(entity, component) : undefined);
  if (!update) return null;
  return update.value[0];
}

/**
 * Handles subscribing and unsubscribing to a queries update stream to keep the matching set up to date
 * @param queryFragments Query fragments
 * @returns Mobx ObservablesSet with entities currently matching the query
 * @deprecated Use hooks exported from @mud-classic/react package instead.
 */
export function useQuery(queryFragments: EntityQueryFragment[]) {
  const [matching, setMatching] = useState<ObservableSet<EntityIndex>>();

  useEffect(() => {
    const queryResult = defineQuery(queryFragments, { runOnInit: true });
    const subscription = queryResult.update$.subscribe();
    setMatching(queryResult.matching);
    return () => subscription?.unsubscribe();
  }, []);

  return matching;
}

/**
 * Returns the current list of entities for a given component and re-renders
 * reactively on any add/update/remove via the component's update$ stream.
 */
export function useComponentEntities<T extends Schema>(component: Component<T>) {
  const [list, setList] = useState<EntityIndex[]>(() =>
    Array.from(getComponentEntities(component))
  );

  useEffect(() => {
    const recompute = () => setList(Array.from(getComponentEntities(component)));
    recompute();
    const sub = component.update$.subscribe(recompute);
    return () => sub?.unsubscribe();
  }, [component]);

  return list;
}

export function useBridgeOpener() {
  const { openBridge } = useInterwovenKit();

  const bridgeTransferDetails = {
    srcChainId: 'interwoven-1',
    srcDenom: 'move/edfcddacac79ab86737a1e9e65805066d8be286a37cb94f4884b892b0e39f954',
    dstChainId: 'interwoven-1',
    dstDenom: 'ibc/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162A1A47DB930D40D8AF4',
    quantity: '0',
  };

  return () => openBridge(bridgeTransferDetails);
}
