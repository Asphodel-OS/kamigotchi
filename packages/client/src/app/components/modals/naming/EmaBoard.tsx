import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ActionButton, IconButton, KamiCard, ModalWrapper, Tooltip } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { useIcon } from 'assets/images/icons/actions';
import { getAccountFromBurner } from 'network/shapes/Account';
import { getInventoryByHolderItem } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';

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
          const { world, components } = network;
          const account = getAccountFromBurner(network, {
            inventory: true,
            kamis: true,
          });

          return {
            network,
            data: {
              account: account,
              dustAmt: getInventoryByHolderItem(world, components, account.id, 111).balance,
            },
          };
        })
      ),

    // Render
    ({ network, data }) => {
      const { account, dustAmt } = data;
      const { actions, api } = network;
      const { modals, setModals } = useVisibility();
      const { setKami } = useSelected();

      const promptRename = (kami: Kami) => {
        setKami(kami.entityIndex);
        setModals({ ...modals, emaBoard: false, nameKami: true });
      };

      const useRenamePotion = (kami: Kami) => {
        const itemIndex = 111;
        actions.add({
          action: 'KamiFeed',
          params: [kami.id, itemIndex],
          description: `Using holy dust on ${kami.name}`,
          execute: async () => {
            return api.player.pet.feed(kami.id, itemIndex);
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
        return !!kami.can.name;
      };

      // set the button based on whether
      const RenameButton = (kami: Kami) => {
        let tooltipText = '';
        if (isHarvesting(kami)) tooltipText = 'too far away';
        else if (isDead(kami)) tooltipText = 'the dead cannot hear you';
        else if (!canName(kami)) tooltipText = 'cannot rename. use some holy dust!';

        const disabled = !!tooltipText;
        if (!disabled) tooltipText = `a holy pact..`;

        const button = (
          <ActionButton onClick={() => promptRename(kami)} text='Rename' disabled={disabled} />
        );

        return <Tooltip text={[tooltipText]}>{button}</Tooltip>;
      };

      // button to use holy dust (rename potion)
      const UseDustButton = (kami: Kami) => {
        let tooltipText = '';
        if (canName(kami)) tooltipText = 'this kami can already be renamed';
        else if (isHarvesting(kami)) tooltipText = 'too far away';
        else if (isDead(kami)) tooltipText = 'the dead cannot hear you';
        else if (dustAmt == 0) tooltipText = 'you have no holy dust';

        const disabled = !!tooltipText;
        if (!disabled) tooltipText = `use holy dust (${dustAmt})`;

        const button = (
          <IconButton img={useIcon} onClick={() => useRenamePotion(kami)} disabled={disabled} />
        );

        return <Tooltip text={[tooltipText]}>{button}</Tooltip>;
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
          <List>{KamiList(account.kamis)}</List>
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
