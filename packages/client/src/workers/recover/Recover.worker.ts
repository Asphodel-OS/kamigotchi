import { verifyMessage } from 'ethers/lib/utils';
import { expose } from 'threads';

import { Message } from 'engine/types/ecs-relay';
import { messagePayload } from 'engine/utils';

function recoverAddress(msg: Message) {
  return verifyMessage(messagePayload(msg), msg.signature);
}

expose({ recoverAddress });
