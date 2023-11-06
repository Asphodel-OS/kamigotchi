import { verifyMessage } from "ethers/lib/utils";
import { expose } from "threads";

import { Message } from "../types/ecs-relay/ecs-relay";
import { messagePayload } from "../utils";

function recoverAddress(msg: Message) {
  return verifyMessage(messagePayload(msg), msg.signature);
}

expose({ recoverAddress });
