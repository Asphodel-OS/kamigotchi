import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getAccountKamis } from 'app/cache/account';
import { filterInventories } from 'app/cache/inventory';
import { ActionButton, IconButton, KamiCard, ModalWrapper, Tooltip } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { useIcon } from 'assets/images/icons/actions';
import { HOLY_DUST_INDEX } from 'constants/items';
import { getAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';

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
          const accountEntity = queryAccountFromEmbedded(network);
          const inventory = getAccount(world, components, accountEntity, {
            inventory: true,
          }).inventories!;
          const dust = filterInventories(inventory, 'HOLY_DUST_INDEX')[0]?.balance ?? 0;
          console.log(`dust ${JSON.stringify(dust)}`);
          return {
            network,
            data: {
              accountEntity,
              dustAmt: dust,
            },
            utils: {
              getAccountKamis: () => getAccountKamis(world, components, accountEntity),
            },
          };
        })
      ),

    // Render
    ({ network, data, utils }) => {
      const { dustAmt, accountEntity } = data;
      console.log(`dustatm  ${dustAmt}`);
      const { actions, api } = network;
      const { getAccountKamis } = utils;
      const { modals, setModals } = useVisibility();
      const { setKami } = useSelected();
      const [kamis, setKamis] = useState<any[]>([]);

      const promptRename = (kami: Kami) => {
        setKami(kami.entity);
        setModals({ emaBoard: false, nameKami: true });
      };

      const useRenamePotion = (kami: Kami) => {
        const itemIndex = HOLY_DUST_INDEX;
        actions.add({
          action: 'KamiFeed',
          params: [kami.id, itemIndex],
          description: `Using holy dust on ${kami.name}`,
          execute: async () => {
            return api.player.pet.use.item(kami.id, itemIndex);
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
        return !!kami.flags?.namable;
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

      useEffect(() => {
        KamiList();
      }, [modals.emaBoard, accountEntity]);

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

      const KamiList = () => {
        setKamis(getAccountKamis());
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
