import { EntityID } from '@latticexyz/recs';
import React from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import crypto from "crypto";

import { useIcon } from "assets/images/icons/actions";
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { IconButton } from 'layers/react/components/library/IconButton';
import { KamiCard } from 'layers/react/components/library/KamiCard';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Kami } from 'layers/react/shapes/Kami';
import { useComponentSettings } from 'layers/react/store/componentSettings';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';


export function registerEMABoardModal() {
  registerUIComponent(
    'EmaBoard',
    {
      colStart: 33,
      colEnd: 67,
      rowStart: 13,
      rowEnd: 99,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          actions,
          components: {
            AccountID,
            Balance,
            CanName,
            IsPet,
            Location,
            MediaURI,
            Name,
            State,
          },
          api: { player },
        },
      } = layers;

      return merge(
        AccountID.update$,
        Balance.update$,
        CanName.update$,
        IsPet.update$,
        Location.update$,
        Name.update$,
        State.update$,
        MediaURI.update$
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(layers, { kamis: true, inventory: true });
          return {
            actions,
            data: { account },
            api: player,
          };
        })
      );
    },

    // Render
    ({ actions, data, api }) => {
      const { modals, setModals } = useComponentSettings();
      const { setKami } = useSelectedEntities();

      const promptRename = (kami: Kami) => {
        setKami(kami.entityIndex);
        setModals({ ...modals, emaBoard: false, nameKami: true });
      };

      const useRenamePotion = (kami: Kami) => {
        const inv = data.account.inventories?.consumables.find((inv) => inv.item.index === 9001);
        if (!inv) return;

        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'KamiFeed',
          params: [kami.id, inv.id],
          description: `Using holy dust on ${kami.name}`,
          execute: async () => {
            return api.pet.use(kami.id, inv.id);
          },
        });
      }

      // check whether the kami is harvesting
      const isHarvesting = (kami: Kami): boolean => {
        return kami.state === 'HARVESTING';
      }

      const isDead = (kami: Kami): boolean => {
        return kami.state === 'DEAD';
      }

      const canName = (kami: Kami): boolean => {
        return kami.namable ? kami.namable : false;
      }

      // set the button based on whether
      const RenameButton = (kami: Kami) => {
        let button = (
          <ActionButton
            id='name_kami_button'
            onClick={() => promptRename(kami)}
            text='Rename'
            disabled={!canName(kami) || isHarvesting(kami) || isDead(kami)}
          />
        );

        if (isHarvesting(kami)) {
          return <Tooltip text={['too far away']}>{button}</Tooltip>
        } else if (isDead(kami)) {
          return <Tooltip text={['cannot hear you (dead)']}>{button}</Tooltip>
        } else if (!canName(kami)) {
          return <Tooltip text={['cannot rename;', 'use some holy dust!']}>{button}</Tooltip>
        }
        return button;
      }

      // button to use holy dust (rename potion)
      const UseDustButton = (kami: Kami) => {
        if (canName(kami)) return <div></div>;

        const dustAmtRaw = data.account.inventories?.consumables.find((inv) => inv.item.index === 9001)?.balance;
        const dustAmt = dustAmtRaw ? dustAmtRaw : 0;

        let button = (
          <IconButton
            id='use_dust_button'
            img={useIcon}
            onClick={() => useRenamePotion(kami)}
            disabled={dustAmt == 0 || isHarvesting(kami) || isDead(kami)}
          />
        );

        if (isHarvesting(kami)) {
          return <Tooltip text={['too far away']}>{button}</Tooltip>
        } else if (isDead(kami)) {
          return <Tooltip text={['cannot hear you (dead)']}>{button}</Tooltip>
        } else if (dustAmt == 0) {
          return <Tooltip text={['you have no holy dust']}>{button}</Tooltip>
        }
        return <Tooltip text={['use holy dust']}>{button}</Tooltip>;
      }

      const CombinedButton = (kami: Kami) => {
        return (
          <ButtonsContainer>
            {UseDustButton(kami)}
            {RenameButton(kami)}
          </ButtonsContainer>
        );
      }

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
            action={CombinedButton(kami)}
            description={description}
          />
        );
      }

      const KamiList = (kamis: Kami[]) => {
        return kamis.map((kami: Kami) => Kard(kami));
      }

      return (
        <ModalWrapperFull
          id='ema_board_modal'
          divName='emaBoard'
          header={<Title>Ema Board</Title>}
          canExit
        >
          <List>{KamiList(data.account.kamis || [])}</List>
        </ModalWrapperFull>
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


