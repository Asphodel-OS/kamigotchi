import { useInterwovenKit } from '@initia/interwovenkit-react';

import { MenuIcons } from 'assets/images/icons/menu';
import { MenuButton } from './MenuButton';

export const BridgeMenuButton = () => {
  const { openBridge } = useInterwovenKit();

  const bridgeTransferDetails = {
    srcChainId: 'interwoven-1',
    srcDenom: 'move/edfcddacac79ab86737a1e9e65805066d8be286a37cb94f4884b892b0e39f954',
    dstChainId: 'interwoven-1',
    dstDenom: 'ibc/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162A1A47DB930D40D8AF4',
    quantity: '1',
  };

  return (
    <MenuButton
      id='bridge-button'
      image={MenuIcons.initia}
      tooltip='Bridge'
      onClick={() => openBridge(bridgeTransferDetails)}
    />
  );
};
