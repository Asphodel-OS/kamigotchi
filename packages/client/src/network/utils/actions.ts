import { EntityIndex, getComponentValue } from '@mud-classic/recs';

import { ActionState, defineActionComponent } from 'network/systems/ActionSystem';
import { waitForComponentValueIn } from 'network/utils/';

export async function waitForCompletion(
  Action: ReturnType<typeof defineActionComponent>,
  entity: EntityIndex
): Promise<void> {
  return waitForComponentValueIn(Action, entity, [
    { state: ActionState.Canceled },
    { state: ActionState.Failed },
    { state: ActionState.Complete },
  ]);
}

// retrieve the final state of an Action
export const resolveState = async (
  action: ReturnType<typeof defineActionComponent>,
  transaction: EntityIndex
) => {
  await waitForCompletion(action, transaction);
  const finalState = getComponentValue(action, transaction);
  return finalState?.state;
};

// check if an Action resolved to a successful completion
export const didComplete = async (
  action: ReturnType<typeof defineActionComponent>,
  transaction: EntityIndex
) => {
  const state = await resolveState(action, transaction);
  return state === ActionState.Complete;
};

// check if an Action resolved to failure
export const didFail = async (
  action: ReturnType<typeof defineActionComponent>,
  transaction: EntityIndex
) => {
  const state = await resolveState(action, transaction);
  return state === ActionState.Failed;
};

// check if an Action was canceled or interrupted
export const didCancel = async (
  action: ReturnType<typeof defineActionComponent>,
  transaction: EntityIndex
) => {
  const state = await resolveState(action, transaction);
  return state === ActionState.Canceled;
};
