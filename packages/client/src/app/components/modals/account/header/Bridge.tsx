'use client';

import { useInterwovenKit } from '@initia/interwovenkit-react';
import { truncate } from '@initia/utils';
import { useState } from 'react';
import { parseEther } from 'viem';
import { useAccount, useChainId, useSendTransaction, useSwitchChain } from 'wagmi';

export default function Home() {
  const chainId = useChainId();
  const { address } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { username, openConnect, openWallet, openBridge } = useInterwovenKit();

  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const send = async () => {
    await switchChainAsync({ chainId });
    const transactionHash = await sendTransactionAsync({
      to: address,
      value: parseEther('0.01'),
      chainId: chainId,
    });
    setTransactionHash(transactionHash);
  };

  const bridgeTransferDetails = {
    srcChainId: 'interwoven-1',
    srcDenom: 'move/edfcddacac79ab86737a1e9e65805066d8be286a37cb94f4884b892b0e39f954',
    dstChainId: 'interwoven-1',
    dstDenom: 'ibc/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162A1A47DB930D40D8AF4',
    quantity: '1',
  };

  if (!address) {
    return <button onClick={openConnect}>Connect</button>;
  }

  return (
    <>
      <button onClick={send}>Send</button>
      <button onClick={() => openBridge(bridgeTransferDetails)}>Bridge</button>
      <button onClick={openWallet}>{truncate(username ?? address)}</button>
      {transactionHash && <p>Transaction hash: {transactionHash}</p>}
    </>
  );
}
