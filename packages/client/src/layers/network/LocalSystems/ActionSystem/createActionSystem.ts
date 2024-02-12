import { Provider } from '@ethersproject/providers';
import {
  World,
  createEntity,
  getComponentValue,
  updateComponent,
  EntityID,
  EntityIndex,
  removeComponent,
  setComponent,
} from '@latticexyz/recs';
import { awaitStreamValue } from '@latticexyz/utils';
import { Observable } from 'rxjs';

import { ActionState } from './constants';
import { ActionRequest } from './types';
import { defineActionComponent } from './ActionComponent';

export type ActionSystem = ReturnType<typeof createActionSystem>;

// TODO(ja): set the action ID within the add function instead of passing it in with the ActionRequest.
//  the above is best done After the vite migration is done to avoid an absurd number of merge conflicts.
export function createActionSystem<M = undefined>(
  world: World,
  txReduced$: Observable<string>,
  provider: Provider
) {
  const Action = defineActionComponent<M>(world);
  const requests = new Map<EntityIndex, ActionRequest>();

  /**
   * Schedules an Action from an ActionRequest and schedules it for execution.
   * @param request ActionRequest to be scheduled
   * @returns EntityIndex of the entity created for the action
   */
  function add(request: ActionRequest): EntityIndex {
    // Prevent the same actions from being scheduled multiple times
    const existingAction = world.entityToIndex.get(request.id);
    if (existingAction != null) {
      console.warn(`Action with id ${request.id} is already requested.`);
      return existingAction;
    }

    // Set the action component
    const entityIndex = createEntity(world, undefined, { id: request.id });
    setComponent(Action, entityIndex, {
      description: request.description,
      action: request.action,
      params: request.params ?? [],
      state: ActionState.Requested,
      time: Date.now(),
      on: undefined,
      overrides: undefined,
      metadata: undefined,
      txHash: undefined,
    });

    // Store the request with the Action System
    request.index = entityIndex;
    requests.set(entityIndex, request);

    execute(entityIndex);
    return entityIndex;
  }

  /**
   * Executes the given Action and sets the corresponding fields accordingly.
   * @param index EntityIndex of the Action to be executed
   * @returns void
   */
  async function execute(index: EntityIndex) {
    const request = requests.get(index);
    if (!request || !request.index) return;
    if (
      getComponentValue(Action, request.index)?.state !== ActionState.Requested
    )
      return;
    const updateAction = (updates: any) =>
      updateComponent(Action, request.index!, updates);

    // Update the action state
    updateAction({ state: ActionState.Executing });

    try {
      // Execute the action
      const tx = await request.execute();

      if (tx) {
        // Wait for all tx events to be reduced
        updateAction({
          state: ActionState.WaitingForTxEvents,
          txHash: tx.hash,
        });

        // NOTE: this logic should be baked into the network layer and we should be better handling the
        // other confirmation statuses
        async function waitFor(tx: any) {
          // perform regular wait
          const txConfirmed = await provider
            .waitForTransaction(tx.hash, 1, 8000)
            .catch((e) => handleError(e, request!));
          if (txConfirmed?.status === 0) {
            // if tx did not complete, initiate tx.wait() to throw regular error
            await tx.wait().catch((e: any) => handleError(e, request!));
          }
          return txConfirmed;
        }

        // const txConfirmed = await tx.wait().catch((e: any) => handleError(e, request));
        // const txConfirmed = await provider.waitForTransaction(tx.hash, 1, 8000).catch((e) => handleError(e, action));
        const txConfirmed = waitFor(tx);
        await awaitStreamValue(txReduced$, (v) => v === tx.hash);
        updateAction({ state: ActionState.TxReduced });
        if (request.awaitConfirmation) await txConfirmed;
      }
      updateAction({ state: ActionState.Complete });
    } catch (e) {
      handleError(e, request);
    }
  }

  /**
   * Cancels the action with the given ID if it is in the "Requested" state.
   * @param index EntityIndex of the ActionRequest to be canceled
   * @returns boolean indicating whether the action was successfully canceled
   */
  function cancel(index: EntityIndex): boolean {
    const request = requests.get(index);
    if (!request) {
      console.warn(`Trying to cancel Action Request that does not exist.`);
      return false;
    }
    if (getComponentValue(Action, index)?.state !== ActionState.Requested) {
      console.warn(
        `Trying to cancel Action Request ${request.id} not in the "Requested" state.`
      );
      return false;
    }

    updateComponent(Action, index, { state: ActionState.Cancelled });
    // remove(index);
    return true;
  }

  /**
   * Removes actions disposer of the action with the given ID and removes its pending updates.
   * @param index EntityIndex of the ActionRequest to be removed
   * @param delay delay (ms) after which the action entry should be removed
   */
  function remove(index: EntityIndex, delay = 5000) {
    const request = requests.get(index);
    if (!request) {
      console.warn(`Trying to remove action that does not exist.`);
      return false;
    }

    world.entityToIndex.delete(request.id);
    setTimeout(() => removeComponent(Action, index), delay);
    requests.delete(index); // Remove the request from the ActionSystem
  }

  // Set the action's state to ActionState.Failed
  function handleError(error: any, action: ActionRequest) {
    console.error('handleError() error: ', error);
    console.error('handleError() action: ', action);
    if (!action.index) return;

    let metadata = error;
    if (metadata.reason) metadata = metadata.reason;
    if (metadata.message) metadata = metadata.message;
    updateComponent(Action, action.index, {
      state: ActionState.Failed,
      metadata,
    });
  }

  return {
    Action,
    add,
    cancel,
    remove,
  };
}
