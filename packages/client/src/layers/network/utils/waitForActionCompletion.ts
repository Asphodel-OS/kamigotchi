import { EntityIndex } from '@mud-classic/recs';

import { ActionState, defineActionComponent } from 'layers/network/systems/ActionSystem';
import { waitForComponentValueIn } from 'layers/network/utils/';

export async function waitForActionCompletion(
  Action: ReturnType<typeof defineActionComponent>,
  entity: EntityIndex
): Promise<void> {
  return waitForComponentValueIn(Action, entity, [
    { state: ActionState.Canceled },
    { state: ActionState.Failed },
    { state: ActionState.Complete },
  ]);
}
