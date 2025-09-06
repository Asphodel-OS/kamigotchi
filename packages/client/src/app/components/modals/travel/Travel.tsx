import { interval, map } from 'rxjs';
import { UIComponent } from 'app/root/types';
import { ModalWrapper } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { useTravel } from 'app/stores/travel';
import { TravelConfirm } from './Confirm';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getAccount } from 'app/cache/account';

export const TravelModal: UIComponent = {
  id: 'TravelModal',
  requirement: (layers) =>
    interval(1000).pipe(
      map(() => {
        const { network } = layers;
        const { world, components } = network;
        const accountEntity = queryAccountFromEmbedded(network);
        const accountOptions = { live: 2 };
        return {
          network,
          data: {
            getAccount: () => getAccount(world, components, accountEntity, accountOptions),
          },
        };
      })
    ),
  Render: ({ network, data }) => {
      const { modals, setModals } = useVisibility();
      const { account: travelAccount, targetRoomIndex, resetTravel } = useTravel();

      if (!modals.travelConfirm || targetRoomIndex == null) return null;

      const account = travelAccount ?? data.getAccount();

      return (
        <ModalWrapper id='travelConfirm'>
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