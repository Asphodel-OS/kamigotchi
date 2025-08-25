import { EntityIndex, getComponentValue } from '@mud-classic/recs';

import { ActionState, defineActionComponent } from 'network/systems/ActionSystem';
import { waitForComponentValueIn } from 'network/utils/';

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

// if action completed successfully
// signal the stage area to be cleaned
export const checkActionState = async (
  action: ReturnType<typeof defineActionComponent>,
  transaction: EntityIndex
) => {
  await waitForActionCompletion(action, transaction);
  const finalState = getComponentValue(action, transaction);
  return finalState?.state === ActionState.Complete;
};
