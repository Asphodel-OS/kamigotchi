import { Provider } from "@ethersproject/providers";
import {
  World,
  createEntity,
  getComponentValue,
  updateComponent,
  EntityID,
  EntityIndex,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { awaitStreamValue } from "@latticexyz/utils";
import { Observable } from "rxjs";

import { ActionState } from "./constants";
import { ActionRequest } from "./types";
import { defineActionComponent } from "./ActionComponent";


export type ActionSystem = ReturnType<typeof createActionSystem>;

export function createActionSystem<M = undefined>(world: World, txReduced$: Observable<string>, provider: Provider) {
  const Action = defineActionComponent<M>(world);
  const requests = new Map<string, ActionRequest>();


  // Set the action's state to ActionState.Failed
  function handleError(error: any, action: ActionRequest) {
    if (!action.index) return;
    updateComponent(Action, action.index, { state: ActionState.Failed, metadata: error.reason });
  }


  /**
   * Schedules an action. The action will be executed once its requirement is fulfilled.
   * Note: the requirement will only be rechecked automatically if the requirement is based on components
   * (or other mobx-observable values).
   * @param actionRequest Action to be scheduled
   * @returns index of the entity created for the action
   */
  function add(actionRequest: ActionRequest): EntityIndex {
    // Prevent the same actions from being scheduled multiple times
    const existingAction = world.entityToIndex.get(actionRequest.id);
    if (existingAction != null) {
      console.warn(`Action with id ${actionRequest.id} is already requested.`);
      return existingAction;
    }

    // Set the action component
    const entityIndex = createEntity(world, undefined, { id: actionRequest.id });
    setComponent(Action, entityIndex, {
      description: actionRequest.description,
      action: actionRequest.action,
      params: actionRequest.params ?? [],
      state: ActionState.Requested,
      time: Date.now(),
      on: undefined,
      overrides: undefined,
      metadata: undefined,
      txHash: undefined,
    });

    // Store the request with the Action System
    actionRequest.index = entityIndex;
    requests.set(actionRequest.id, actionRequest);

    execute(actionRequest);
    return entityIndex;
  }


  /**
   * Executes the given action and sets the corresponding Action component
   * @param action ActionData of the action to be executed
   * @param requirementResult Result of the action's requirement function
   * @returns void
   */
  async function execute(action: ActionRequest) {
    if (!action.index) return;

    // Only execute actions that were requested before
    if (getComponentValue(Action, action.index)?.state !== ActionState.Requested) return;

    // Update the action state
    updateComponent(Action, action.index, { state: ActionState.Executing });

    try {
      // Execute the action
      const tx = await action.execute();
      if (tx) {
        // Wait for all tx events to be reduced
        updateComponent(Action, action.index, { state: ActionState.WaitingForTxEvents, txHash: tx.hash });
        // console.log(tx);
        async function waitFor(tx: any) {
          // perform regular wait 
          const txConfirmed = await provider.waitForTransaction(tx.hash, 1, 8000).catch((e) => handleError(e, action));
          if (txConfirmed?.status === 0) {
            // if tx did not complete, initiate tx.wait() to throw regular error
            await tx.wait().catch((e: any) => handleError(e, action));
          }
          return txConfirmed;
        }
        // const txConfirmed = provider.waitForTransaction(tx.hash, 1, 8000).catch((e) => handleError(e, action));
        const txConfirmed = waitFor(tx);
        await awaitStreamValue(txReduced$, (v) => v === tx.hash);
        updateComponent(Action, action.index, { state: ActionState.TxReduced });
        if (action.awaitConfirmation) await txConfirmed;
      }
      updateComponent(Action, action.index, { state: ActionState.Complete });
    } catch (e) {
      handleError(e, action);
    }
  }


  /**
   * Cancels the action with the given ID if it is in the "Requested" state.
   * @param actionId ID of the action to be cancelled
   * @returns void
   */
  function cancel(actionId: EntityID): boolean {
    const request = requests.get(actionId);
    if (!request) {
      console.warn(`Trying to cancel Action Request ${actionId} that does not exist.`);
      return false;
    }
    if (!request.index) {
      console.warn(`Trying to cancel Action Request ${actionId} that has not been indexed.`);
      return false;
    }
    const state = getComponentValue(Action, request.index)?.state;
    if (state !== ActionState.Requested) {
      console.warn(`Trying to cancel Action Request ${actionId} not in the "Requested" state.`);
      return false;
    }

    // remove(actionId);
    updateComponent(Action, request.index, { state: ActionState.Cancelled });
    return true;
  }


  /**
   * Removes actions disposer of the action with the given ID and removes its pending updates.
   * @param actionId ID of the action to be removed
   * @param timeout Timeout in ms after which the action entry should be removed
   */
  function remove(actionId: EntityID, timeout = 5000) {
    if (!requests.get(actionId)) {
      console.warn(`Trying to remove action ${actionId} that does not exist.`);
      return false;
    }

    // Remove the action entity from the world and the value from the Action component map
    const actionIndex = world.entityToIndex.get(actionId);
    if (actionIndex != null) {
      world.entityToIndex.delete(actionId);
      setTimeout(() => removeComponent(Action, actionIndex), timeout);
    }

    requests.delete(actionId);  // Remove the request from the ActionSystem
  }

  return {
    Action,
    add,
    cancel,
    remove,
  };
}
