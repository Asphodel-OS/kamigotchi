import { createChannel, createClient } from 'nice-grpc-web';

import { FaucetServiceDefinition } from 'engine/types/faucet/faucet';
import { Dispatch, SetStateAction } from 'react';

export const dripEth = async (account: any, setError: Dispatch<SetStateAction<any>>) => {
  const url = 'https://faucet.test.asphodel.io';

  try {
    const faucetClient = createClient(FaucetServiceDefinition, createChannel(url));
    await faucetClient.drip({ address: account });
  } catch (e: any) {
    setError(e.response.data.message);
    console.log('fallo');
    //console.log('e.response.data.message' + e.response.data.message);
  }
};
