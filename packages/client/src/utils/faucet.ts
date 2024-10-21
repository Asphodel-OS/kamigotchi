import { createChannel, createClient } from 'nice-grpc-web';

import { FaucetServiceDefinition } from 'engine/types/faucet/faucet';
import { Dispatch, SetStateAction } from 'react';

export const dripEth = async (
  account: any,
  setError: Dispatch<SetStateAction<boolean>>,
  setShowModal: Dispatch<SetStateAction<boolean>>
) => {
  const url = 'https://faucet.test.asphodel.io';
  let response;
  try {
    const faucetClient = createClient(FaucetServiceDefinition, createChannel(url));
    const response = await faucetClient.drip({ address: account });
    setError(false);
    setShowModal(true);
  } catch (e) {
    setError(true);
    setShowModal(true);
  }
};
