import { EntityIndex } from "@mud-classic/recs";

import { waitForComponentValueIn } from "layers/network/utils/";
import { ActionState, defineActionComponent } from "layers/network/systems/ActionSystem";


export async function waitForActionCompletion(
  Action: ReturnType<typeof defineActionComponent>,
  entity: EntityIndex
): Promise<void> {
  return waitForComponentValueIn(Action, entity, [
    { state: ActionState.Cancelled },
    { state: ActionState.Failed },
    { state: ActionState.Complete },
  ]);
}
