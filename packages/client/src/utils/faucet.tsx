import { createChannel, createClient } from 'nice-grpc-web';

import { FaucetServiceDefinition } from 'engine/types/faucet/faucet';
import { Dispatch, SetStateAction } from 'react';

export const dripEth = async (account: any, setError: Dispatch<SetStateAction<any>>) => {
  const url = 'https://faucet.test.asphodel.io';

  try {
    const faucetClient = createClient(FaucetServiceDefinition, createChannel(url));
    //change this later
    setError({ currentState: false, message: 'Succeeded!' });
    await faucetClient.drip({ address: account });
  } catch (e: any) {
    setError({ currentState: true, message: e.response.data.message });
  }
};
