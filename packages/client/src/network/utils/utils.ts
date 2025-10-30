import {
  Component,
  ComponentValue,
  EntityIndex,
  Metadata,
  Schema,
  componentValueEquals,
} from 'engine/recs';
import { filter } from 'rxjs';

import { deferred } from 'utils/async';

export function waitForComponentValueUpdate<S extends Schema, T>(
  component: Component<S, Metadata, T>,
  entity: EntityIndex
): Promise<void> {
  const [resolve, , promise] = deferred<void>();

  let dispose = resolve;
  const subscription = component.update$.pipe(filter((e) => e.entity === entity)).subscribe(() => {
    resolve();
    dispose();
  });

  dispose = () => subscription?.unsubscribe();

  return promise;
}

export function waitForComponentValueIn<S extends Schema, T>(
  component: Component<S, Metadata, T>,
  entity: EntityIndex,
  values: Partial<ComponentValue<S>>[]
): Promise<void> {
  const [resolve, , promise] = deferred<void>();

  let dispose = resolve;
  const subscription = component.update$
    .pipe(
      filter(
        (e) =>
          e.entity === entity &&
          Boolean(values.find((value) => componentValueEquals(value, e.value[0])))
      )
    )
    .subscribe(() => {
      resolve();
      dispose();
    });

  dispose = () => subscription?.unsubscribe();

  return promise;
}

export async function waitForComponentValue<S extends Schema>(
  component: Component<S>,
  entity: EntityIndex,
  value: Partial<ComponentValue<S>>
): Promise<void> {
  await waitForComponentValueIn(component, entity, [value]);
}
