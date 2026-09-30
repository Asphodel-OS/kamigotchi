import { useAccount } from 'app/stores/account';
import { logTxErrorToDB } from 'clients/kamiden/txErrorLogger';
import { GodID, SyncState } from 'engine/constants';
import { getRevertReason } from 'engine/queue/utils';
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
import { log } from 'utils/logger';
import { playError } from 'utils/sounds';
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

  // [tier] txlag telemetry: sync-send returns the mined tx and the worker stream reduces it
  // independently, so either side can land first; negative ms means the ECS saw it first.
  // Every tx in the world is reduced, not just ours, so reduced-first entries only live for
  // the length of that race.
  const MINED_MAX_AGE_MS = 5 * 60 * 1000;
  const REDUCED_MAX_AGE_MS = 30 * 1000;
  const txMinedAt = new Map<string, number>();
  const txReducedAt = new Map<string, number>();

  function isSyncLive(): boolean {
    const loadingState = world.components.find((c) => c.id === 'LoadingState');
    const godEntity = world.entityToIndex.get(GodID);
    if (!loadingState || godEntity == null) return false;
    return (getComponentValue(loadingState, godEntity) as any)?.state === SyncState.LIVE;
  }

  function logTxLag(minedAt: number, reducedAt: number) {
    log.info(`[tier] txlag ms=${(reducedAt - minedAt).toFixed(0)} live=${isSyncLive()}`);
  }

  // Map iteration follows insertion order and timestamps only grow, so the oldest are first.
  function remember(times: Map<string, number>, hash: string, maxAgeMs: number) {
    const now = performance.now();
    for (const [oldHash, at] of times) {
      if (now - at < maxAgeMs) break;
      times.delete(oldHash);
    }
    times.delete(hash);
    times.set(hash, now);
  }

  function onTxMined(hash: string) {
    const reducedAt = txReducedAt.get(hash);
    if (reducedAt === undefined) return remember(txMinedAt, hash, MINED_MAX_AGE_MS);
    txReducedAt.delete(hash);
    logTxLag(performance.now(), reducedAt);
  }

  function onTxReduced(hash: string) {
    const minedAt = txMinedAt.get(hash);
    if (minedAt === undefined) return remember(txReducedAt, hash, REDUCED_MAX_AGE_MS);
    txMinedAt.delete(hash);
    logTxLag(minedAt, performance.now());
  }

  const txLagSub = txReduced$.subscribe(onTxReduced);
  world.registerDisposer(() => txLagSub.unsubscribe());

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

    // Store the request with the Action System and execute it
    request.index = entity;
    requests.set(entity, request);
    execute(request);
    return entity;
  }

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

    try {
      // Execute the action
      const tx = await request.execute();
      updateAction({ state: ActionState.WaitingForTxEvents }); // pending

      if (tx) {
        const txHash = (tx as any).hash;
        updateAction({ txHash });
        onTxMined(txHash);
      }

      updateAction({ state: ActionState.Complete });
    } catch (e) {
      await handleError(e, request);
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

  // Set the action's state to ActionState.Failed and fetch revert reason via debug_traceTransaction.
  // The revert reason is stored in metadata for display in the UI tooltip.
  async function handleError(error: any, action: ActionRequest) {
    if (!action.index) return;

    const txHash = error?.receipt?.transactionHash || error?.transactionHash || error?.hash;
    const nonce = error?.nonce ?? '';
    let metadata: string | undefined;

    // Fetch revert reason and persist it in metadata
    if (txHash) {
      try {
        metadata = await getRevertReason(txHash, provider);
        if (metadata) {
          log.warn('[ActionSystem] TX FAILED', { txHash, revertReason: metadata });
        }
      } catch {
        // Fall through to default extraction
      }
    }

    // Fallback: extract from error object
    if (!metadata) {
      let errData = error;
      if (errData.reason) errData = errData.reason;
      if (errData.error) errData = errData.error;
      else if (errData.data) errData = errData.data;
      if (errData.message) errData = errData.message;
      metadata = typeof errData === 'string' ? errData : error.message || 'Transaction failed';
    }

    updateComponent(Action, action.index, { state: ActionState.Failed, metadata });
    playError();

    const account = useAccount.getState().account;
    log.debug('[ActionSystem] Logging tx error', {
      operatorAddress: account.operatorAddress,
      action: action.action,
      description: action.description,
    });
    logTxErrorToDB(error, {
      sender: account.operatorAddress ?? '',
      system: action.action ?? 'unknown',
      method: action.description ?? 'unknown',
      nonce: nonce != null ? String(nonce) : undefined,
      txhash: txHash,
    });
  }

  return {
    Action,
    add,
    cancel,
    remove,
  };
}
