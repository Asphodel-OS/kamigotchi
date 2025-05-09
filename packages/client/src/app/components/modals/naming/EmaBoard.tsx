import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getAccount, getAccountKamis } from 'app/cache/account';
import { getInventoryBalance, Inventory } from 'app/cache/inventory';
import { ActionButton, KamiCard, ModalWrapper, Tooltip } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { HOLY_DUST_INDEX } from 'constants/items';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';

const REFRESH_INTERVAL = 2000;

export function registerEMABoardModal() {
  registerUIComponent(
    'EmaBoard',
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 3,
      rowEnd: 99,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const accountEntity = queryAccountFromEmbedded(network);
          const kamiRefreshOptions = { live: 2, flags: 2 };

          return {
            network,
            data: {
              accountEntity,
            },
            utils: {
              getAccountKamis: () =>
                getAccountKamis(world, components, accountEntity, { live: 2, flags: 2 }),
              getAccount: () => getAccount(world, components, accountEntity, { live: 2 }),
              getDustBalance: (inventory: Inventory[]) =>
                getInventoryBalance(inventory, HOLY_DUST_INDEX),
            },
          };
        })
      ),

    // Render
    ({ network, data, utils }) => {
      const { accountEntity } = data;
      const { actions, api } = network;
      const { getAccountKamis, getAccount, getDustBalance } = utils;
      const { modals, setModals } = useVisibility();
      const { setKami } = useSelected();
      const [kamis, setKamis] = useState<any[]>([]);
      const [dustAmt, setDustAmt] = useState<number>();
      const [lastRefresh, setLastRefresh] = useState(Date.now());

      /////////////////
      // SUBSCRIPTIONS

      useEffect(() => {
        const refreshClock = () => setLastRefresh(Date.now());
        const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
        return () => clearInterval(timerId);
      }, []);

      useEffect(() => {
        if (!modals.emaBoard || getAccount().roomIndex !== 11) return;
        setKamis(getAccountKamis());
        let inventory = getAccount().inventories;
        if (inventory) {
          let dustAmt = getDustBalance(inventory);
          setDustAmt(dustAmt);
        }
      }, [modals.emaBoard, accountEntity, lastRefresh]);

      const promptRename = (kami: Kami) => {
        setKami(kami.index);
        setModals({ emaBoard: false, nameKami: true });
      };

      // check whether the kami is harvesting
      const isHarvesting = (kami: Kami): boolean => {
        return kami.state === 'HARVESTING';
      };

      const isDead = (kami: Kami): boolean => {
        return kami.state === 'DEAD';
      };

      const getTooltip = (kami: Kami) => {
        let tooltip = '';
        if (isHarvesting(kami)) tooltip = 'too far away';
        else if (isDead(kami)) tooltip = 'the dead cannot hear you';
        else if (dustAmt == 0) tooltip = 'you have no holy dust';
        const disabled = !!tooltip;
        if (!disabled) tooltip = `a holy pact..`;
        return tooltip;
      };

      const canRename = (kami: Kami): boolean => {
        if (isHarvesting(kami)) return false;
        if (isDead(kami)) return false;
        if (dustAmt == 0) return false;
        return true;
      };

      // Rendering of Individual Kami Cards in the Name Modal
      const Kard = (kami: Kami) => {
        let description = [] as string[];
        if (kami.state) {
          description = [
            `${kami.state[0] + kami.state.slice(1).toLowerCase()}`,
            `and loves you very much`,
          ];
        }
        return (
          <KamiCard
            key={kami.index}
            kami={kami}
            actions={
              <Tooltip text={[getTooltip(kami)]}>
                <ActionButton
                  onClick={() => promptRename(kami)}
                  text='Rename'
                  disabled={!canRename(kami)}
                />
              </Tooltip>
            }
            description={description}
          />
        );
      };

      return (
        <ModalWrapper id='emaBoard' header={<Title>Ema Board</Title>} canExit>
          <List>{kamis.map((kami) => Kard(kami)) ?? []}</List>
        </ModalWrapper>
      );
    }
  );
}

const Title = styled.div`
  color: #333;
  padding: 2vw;

  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;

const List = styled.div`
  overflow-y: scroll;
  height: 100%;
  max-height: 100%;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
`;
