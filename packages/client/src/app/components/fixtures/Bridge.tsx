'use client';

import { useInterwovenKit } from '@initia/interwovenkit-react';
import { useAccount } from 'wagmi';

import { MenuIcons } from 'assets/images/icons/menu';
import { MenuButton } from './menu/buttons/MenuButton';

export default function Home() {
  const { address } = useAccount();
  const { openConnect, openBridge } = useInterwovenKit();

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
    <MenuButton
      id='bridge-button'
      image={MenuIcons.initia}
      tooltip='Bridge'
      onClick={() => openBridge(bridgeTransferDetails)}
    />
  );
}
