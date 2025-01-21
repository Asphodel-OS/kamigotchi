import { Provider } from '@ethersproject/providers';
import {
  EntityID,
  EntityIndex,
  World,
  createEntity,
  getComponentValue,
  removeComponent,
  setComponent,
  updateComponent,
} from '@mud-classic/recs';
import { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { defineActionComponent } from './ActionComponent';
import { ActionState } from './constants';
import { ActionRequest } from './types';

export type ActionSystem = ReturnType<typeof createActionSystem>;

export function createActionSystem<M = undefined>(
  world: World,
  txReduced$: Observable<string>,
  provider: Provider
) {
  const Action = defineActionComponent<M>(world);
  const requests = new Map<EntityIndex, ActionRequest>();

  /**
   * Schedules an Action from an ActionRequest and schedules it for execution.
   * TODO(ja): set the action ID within the add function instead of passing it in on ActionRequest.
   * @param request ActionRequest to be scheduled
   * @returns EntityIndex of the entity created for the action
   */
  function add(request: ActionRequest): EntityIndex {
    if (!request.id) {
      const id = uuid() as EntityID;
      request.id = id;
    }

    // Prevent the same actions from being scheduled multiple times
    // NOTE: we need additional logic for generation consistent hash IDs for this to work
    // we want to hash the parameters and action and check against the state of previous requests
    // to determin whether an equivalent action is already scheduled
    const existingAction = world.entityToIndex.get(request.id);
    if (existingAction != null) {
      console.warn(`Action with id ${request.id} is already requested.`);
      return existingAction;
    }

    // Set the action component
    const entity = createEntity(world, undefined, { id: request.id });
    setComponent(Action, entity, {
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

    // Store the request with the Action System and execute it
    request.index = entity;
    requests.set(entity, request);
    execute(request);
    return entity;
  }

  /**
   * Executes the given Action and sets the corresponding fields accordingly.
   * @param index EntityIndex of the Action to be executed
   * @returns void
   */
  async function execute(request: ActionRequest) {
    const actionState = getComponentValue(Action, request.index!)?.state;
    if (actionState !== ActionState.Requested) return;

    // Update the action state
    const updateAction = (data: any) => updateComponent(Action, request.index!, data);
    updateAction({ state: ActionState.Executing });

    try {
      // Execute the action
      const tx = await request.execute();
      updateAction({ state: ActionState.WaitingForTxEvents }); // pending

      if (tx) {
        // const txConfirmed = await tx.wait().catch((e: any) => handleError(e, request));
        const txConfirmed = await tx.wait();
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
      console.warn(`Trying to cancel Action Request ${request.id} not in the "Requested" state.`);
      return false;
    }

    updateComponent(Action, index, { state: ActionState.Canceled });
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

    if (request.id) world.entityToIndex.delete(request.id);
    setTimeout(() => removeComponent(Action, index), delay);
    requests.delete(index); // Remove the request from the ActionSystem
  }

  // Set the action's state to ActionState.Failed and pass through the error
  // message as metadata. The rest of the error is logged as a warning and can
  // be bubbled up, but does not appear to be useful for clientside reporting.
  function handleError(error: any, action: ActionRequest) {
    console.warn('handleError()', '\naction: ', action, '\nerror: ', error);
    if (!action.index) return;

    let metadata = error;
    if (metadata.reason) metadata = metadata.reason;
    if (metadata.error) metadata = metadata.error;
    else if (metadata.data) metadata = metadata.data;
    if (metadata.message) metadata = metadata.message;
    updateComponent(Action, action.index, { state: ActionState.Failed, metadata });
  }

  return {
    Action,
    add,
    cancel,
    remove,
  };
}
