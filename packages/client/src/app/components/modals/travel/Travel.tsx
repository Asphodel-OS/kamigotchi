import { getAccount } from 'app/cache/account';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useTravel, useVisibility } from 'app/stores';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { useMemo } from 'react';
import { TravelConfirm } from './Confirm';
import { of } from 'rxjs';

export const TravelModal: UIComponent = {
  id: 'TravelModal',
  requirement: (layers) => of({ network: layers.network }),
  Render: ({ network }) => {
    const isVisible = useVisibility((s) => s.modals.travelConfirm);
    const setModals = useVisibility((s) => s.setModals);

    const travelAccount = useTravel((s) => s.account);
    const targetRoomIndex = useTravel((s) => s.targetRoomIndex);
    const resetTravel = useTravel((s) => s.resetTravel);

    const { world, components } = network;
    const accountEntity = queryAccountFromEmbedded(network);
    const accountOptions = { live: 2 };
    const account = useMemo(
      () => travelAccount ?? getAccount(world, components, accountEntity, accountOptions),
      [travelAccount, world, components, accountEntity]
    );

    if (!isVisible || targetRoomIndex == null) return null;

    return (
      <ModalWrapper
        id='travelConfirm'
        header={<ModalHeader title='Fast Travel' />}
        canExit
        overlay
        truncate
        compact
        positionOverride={{ colStart: 25, colEnd: 75, rowStart: 20, rowEnd: 80, position: 'fixed' }}
      >
        <TravelConfirm
          network={network}
          account={account}
          targetRoomIndex={targetRoomIndex}
          onClose={() => {
            resetTravel();
            setModals({ travelConfirm: false });
          }}
        />
      </ModalWrapper>
    );
  },
};
