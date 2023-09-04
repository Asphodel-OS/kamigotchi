import React from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { EntityIndex, Has, HasValue, runQuery } from '@latticexyz/recs';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { KamiCard } from 'layers/react/components/library/KamiCard';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { registerUIComponent } from 'layers/react/engine/store';
import { Account, getAccount, getAccountFromBurner } from 'layers/react/shapes/Account';
import { Kami } from 'layers/react/shapes/Kami';
import { dataStore } from 'layers/react/store/createStore';


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
          components: {
            AccountID,
            CanName,
            IsPet,
            Location,
            MediaURI,
            Name,
            State,
          },
        },
      } = layers;

      return merge(
        AccountID.update$,
        CanName.update$,
        IsPet.update$,
        Location.update$,
        Name.update$,
        State.update$,
        MediaURI.update$
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(layers, { kamis: true });
          return {
            data: { account } as any,
          };
        })
      );
    },

    // Render
    ({ data }) => {
      const {
        visibleModals,
        setVisibleModals,
        selectedEntities,
        setSelectedEntities
      } = dataStore();

      const promptRename = (kami: Kami) => {
        setSelectedEntities({
          ...selectedEntities,
          kami: kami.entityIndex,
        });
        setVisibleModals({ ...visibleModals, emaBoard: false, nameKami: true });
      };

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
          return <Tooltip text={['already named']}>{button}</Tooltip>
        }
        return button;
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
            action={RenameButton(kami)}
            description={description}
          />
        );
      }

      const KamiList = (kamis: Kami[]) => {
        kamis = kamis ?? [];
        return kamis.map((kami: Kami) => Kard(kami));
      }

      return (
        <ModalWrapperFull
          id='ema_board_modal'
          divName='emaBoard'
          canExit
        >
          <Title>Ema Board</Title>
          <Scrollable>{KamiList(data.account.kamis)}</Scrollable>
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

const Scrollable = styled.div`
  overflow-y: scroll;
  height: 100%;
  max-height: 100%;
`;


