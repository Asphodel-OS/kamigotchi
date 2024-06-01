import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ActionButton, IconButton, KamiCard, ModalWrapper, Tooltip } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { useIcon } from 'assets/images/icons/actions';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { Inventory } from 'layers/network/shapes/Inventory';
import { Kami } from 'layers/network/shapes/Kami';

export function registerEMABoardModal() {
  registerUIComponent(
    'EmaBoard',
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 13,
      rowEnd: 99,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const account = getAccountFromBurner(network, {
            inventory: true,
            kamis: true,
          });

          return {
            network,
            data: { account },
          };
        })
      ),

    // Render
    ({ network, data }) => {
      const { actions, api } = network;
      const { modals, setModals } = useVisibility();
      const { setKami } = useSelected();

      const promptRename = (kami: Kami) => {
        setKami(kami.entityIndex);
        setModals({ ...modals, emaBoard: false, nameKami: true });
      };

      const useRenamePotion = (kami: Kami) => {
        const inv = data.account.inventories?.consumables.find(
          (inv: Inventory) => inv.item.index === 9001
        );
        if (!inv) return;

        actions.add({
          action: 'KamiFeed',
          params: [kami.id, inv.id],
          description: `Using holy dust on ${kami.name}`,
          execute: async () => {
            return api.player.pet.use(kami.id, inv.id);
          },
        });
      };

      // check whether the kami is harvesting
      const isHarvesting = (kami: Kami): boolean => {
        return kami.state === 'HARVESTING';
      };

      const isDead = (kami: Kami): boolean => {
        return kami.state === 'DEAD';
      };

      const canName = (kami: Kami): boolean => {
        return kami.namable ? kami.namable : false;
      };

      // set the button based on whether
      const RenameButton = (kami: Kami) => {
        let button = (
          <ActionButton
            onClick={() => promptRename(kami)}
            text='Rename'
            disabled={!canName(kami) || isHarvesting(kami) || isDead(kami)}
          />
        );

        if (isHarvesting(kami)) {
          return <Tooltip text={['too far away']}>{button}</Tooltip>;
        } else if (isDead(kami)) {
          return <Tooltip text={['cannot hear you (dead)']}>{button}</Tooltip>;
        } else if (!canName(kami)) {
          return <Tooltip text={['cannot rename;', 'use some holy dust!']}>{button}</Tooltip>;
        }
        return button;
      };

      // button to use holy dust (rename potion)
      const UseDustButton = (kami: Kami) => {
        if (canName(kami)) return <div></div>;

        const dustAmtRaw = data.account.inventories?.consumables.find(
          (inv) => inv.item.index === 9001
        )?.balance;
        const dustAmt = dustAmtRaw ? dustAmtRaw : 0;

        let button = (
          <IconButton
            img={useIcon}
            onClick={() => useRenamePotion(kami)}
            disabled={dustAmt == 0 || isHarvesting(kami) || isDead(kami)}
          />
        );

        if (isHarvesting(kami)) {
          return <Tooltip text={['too far away']}>{button}</Tooltip>;
        } else if (isDead(kami)) {
          return <Tooltip text={['cannot hear you (dead)']}>{button}</Tooltip>;
        } else if (dustAmt == 0) {
          return <Tooltip text={['you have no holy dust']}>{button}</Tooltip>;
        }
        return <Tooltip text={['use holy dust']}>{button}</Tooltip>;
      };

      const CombinedButton = (kami: Kami) => {
        return (
          <ButtonsContainer>
            {UseDustButton(kami)}
            {RenameButton(kami)}
          </ButtonsContainer>
        );
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
            actions={CombinedButton(kami)}
            description={description}
          />
        );
      };

      const KamiList = (kamis: Kami[]) => {
        return kamis.map((kami: Kami) => Kard(kami));
      };

      return (
        <ModalWrapper id='emaBoard' header={<Title>Ema Board</Title>} canExit>
          <List>{KamiList(data.account.kamis)}</List>
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
