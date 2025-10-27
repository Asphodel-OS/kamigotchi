import {
  EntityID,
  EntityIndex,
  World,
  createEntity,
  getComponentValue,
  removeComponent,
  setComponent,
  updateComponent,
} from 'engine/recs';
import { Provider } from 'ethers';
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
  const queueOrder: EntityIndex[] = [];
  let running: boolean = false;
  let currentIndex: EntityIndex | null = null;

  /**
   * Schedules an Action from an ActionRequest and schedules it for execution.
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

    // Store the request with the Action System and enqueue it
    request.index = entity;
    requests.set(entity, request);
    queueOrder.push(entity);
    processNext();
    return entity;
  }
  async function processNext() {
    if (running) return;
    // find next requested (not canceled) action
    while (queueOrder.length > 0) {
      const idx = queueOrder[0]!;
      const state = getComponentValue(Action, idx)?.state;
      if (state === ActionState.Canceled) {
        queueOrder.shift();
        continue;
      }
      if (state === ActionState.Requested) {
        running = true;
        currentIndex = idx;
        try {
          await execute(requests.get(idx)!);
        } finally {
          // remove from queue and continue
          queueOrder.shift();
          currentIndex = null;
          running = false;
          // kick off next
          setTimeout(processNext, 0);
        }
        return;
      }
      // if not in a requested state, remove and continue
      queueOrder.shift();
    }
  }

  // Track cancellations requested while action is executing
  const canceled = new Set<EntityIndex>();
  const execCancels = new Map<EntityIndex, () => void>();

  /**
   * Executes the given Action and sets the corresponding fields accordingly.
   * @param index EntityIndex of the Action to be executed
   */
  async function execute(request: ActionRequest) {
    const actionState = getComponentValue(Action, request.index!)?.state;
    if (actionState !== ActionState.Requested) return;

    // Update the action state
    const updateAction = (data: any) => updateComponent(Action, request.index!, data);
    updateAction({ state: ActionState.Executing });

    // If a cancel was requested before execution starts, honor it
    if (canceled.has(request.index!)) {
      updateAction({ state: ActionState.Canceled });
      return;
    }

    try {
      // Execute the action
      const execPromise: any = request.execute();
      const cancelFn =
        typeof execPromise?.cancel === 'function'
          ? execPromise.cancel.bind(execPromise)
          : undefined;
      if (cancelFn) execCancels.set(request.index!, cancelFn);

      // If user already canceled, propagate to queue immediately
      if (canceled.has(request.index!) && cancelFn) {
        try {
          cancelFn();
        } catch {}
        updateAction({ state: ActionState.Canceled });
        execCancels.delete(request.index!);
        return;
      }

      const tx = await execPromise;
      // Mark pending and expose hash immediately so UI can cancel/replace
      updateAction({
        state: ActionState.WaitingForTxEvents,
        txHash: tx?.hash,
      });

      // If cancel requested after submission, do not proceed to completion
      if (canceled.has(request.index!)) {
        updateAction({ state: ActionState.Canceled });
        return;
      }

      if (tx && !request.skipConfirmation) {
        await tx.wait();
      }

      if (canceled.has(request.index!)) updateAction({ state: ActionState.Canceled });
      else updateAction({ state: ActionState.Complete });
      execCancels.delete(request.index!);
    } catch (e) {
      handleError(e, request);
      execCancels.delete(request.index!);
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
    const state = getComponentValue(Action, index)?.state;
    if (state === ActionState.Requested) {
      // remove from local queue before it ever executes
      const pos = queueOrder.indexOf(index);
      if (pos !== -1) queueOrder.splice(pos, 1);
      canceled.add(index);
      updateComponent(Action, index, { state: ActionState.Canceled });
      return true;
    }
    if (state === ActionState.Executing || state === ActionState.WaitingForTxEvents) {
      canceled.add(index);
      const fn = execCancels.get(index);
      if (fn) {
        try {
          fn();
        } catch {}
      }
      updateComponent(Action, index, { state: ActionState.Canceled });
      return true;
    }
    console.warn(`Trying to cancel Action Request ${request.id} not in a cancellable state.`);
    return false;
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
    // console.warn('handleError()', '\naction: ', action, '\nerror: ', error);
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
