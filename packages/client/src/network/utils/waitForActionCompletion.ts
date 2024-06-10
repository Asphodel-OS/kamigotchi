import { EntityIndex } from '@mud-classic/recs';

import { ActionState, defineActionComponent } from 'network/systems/ActionSystem';
import { waitForComponentValueIn } from 'network/utils/';

export async function waitForActionCompletion(
  Action: ReturnType<typeof defineActionComponent>,
  entity: EntityIndex
): Promise<void> {
  return waitForComponentValueIn(Action, entity, [
    { state: ActionState.Canceled },
    { state: ActionState.Failed },
    { state: ActionState.WaitingForTxEvents }, // need to remove this once we have more reliable event update detection
    { state: ActionState.Complete },
  ]);
}
