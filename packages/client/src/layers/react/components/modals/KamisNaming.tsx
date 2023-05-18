import { EntityIndex, Has, HasValue, runQuery } from '@latticexyz/recs';
import { registerUIComponent } from 'layers/react/engine/store';
import { map, merge } from 'rxjs';
import { Account, getAccount } from '../shapes/Account';
import { Kami, getKami } from '../shapes/Kami';
import { dataStore } from 'layers/react/store/createStore';
import { ModalWrapperFull } from '../library/ModalWrapper';
import styled from 'styled-components';
import React, { useCallback } from 'react';

export function registerKamisNamingModal() {
  registerUIComponent(
    'KamisNaming',
    {
      colStart: 35,
      colEnd: 65,
      rowStart: 8,
      rowEnd: 76,
    },

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          network,
          components: {
            AccountID,
            IsAccount,
            IsPet,
            Location,
            MediaURI,
            Name,
            OperatorAddress,
            State,
          },
        },
      } = layers;

      return merge(
        AccountID.update$,
        Location.update$,
        Name.update$,
        State.update$,
        MediaURI.update$
      ).pipe(
        map(() => {
          const accountIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];

          const account =
            accountIndex !== undefined ? getAccount(layers, accountIndex) : ({} as Account);

          // if we have inventories for the account, generate a list of inventory objects
          const kamis: Kami[] = [];
          if (account) {
            // get the kamis on this account
            const kamiIndices = Array.from(
              runQuery([Has(IsPet), HasValue(AccountID, { value: account.id })])
            );

            // get all kamis on the node
            for (let i = 0; i < kamiIndices.length; i++) {
              kamis.push(getKami(layers, kamiIndices[i], { production: true }));
            }
          }

          return {
            data: {
              account: { ...account, kamis },
            } as any,
          };
        })
      );
    },

    // Render
    ({ data }) => {
      const { visibleModals, setVisibleModals, selectedEntities, setSelectedEntities } =
        dataStore();

      const KamiCard = (props: any) => {
        return (
          <Card>
            <Image src={props.image} />
            <Container>
              <TitleBar>
                <TitleText>{props.title}</TitleText>
              </TitleBar>
              <Button onClick={props.nameKami}>Give name</Button>
            </Container>
          </Card>
        );
      };

      const openKamiNameModal = (entityIndex: EntityIndex) => {
        setSelectedEntities({
          ...selectedEntities,
          kami: entityIndex,
        });
        setVisibleModals({ ...visibleModals, kamisNaming: false, nameKami: true });
      };

      // Rendering of Individual Kami Cards in the Party Modal
      const KamiCards = (kamis: Kami[]) => {
        return kamis.map((kami) => {
          return (
            <KamiCard
              key={kami.id}
              image={kami.uri}
              title={kami.name}
              nameKami={() => {
                openKamiNameModal(kami.entityIndex);
              }}
            />
          );
        });
      };

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, kamisNaming: false });
      }, [setVisibleModals, visibleModals]);

      return (
        <ModalWrapperFull id='kamis_naming_modal' divName='kamisNaming' fill={true}>
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          <Scrollable>{KamiCards(data.account.kamis)}</Scrollable>
        </ModalWrapperFull>
      );
    }
  );
}

const Button = styled.button`
  cursor: pointer;
  &:active {
    background-color: #c4c4c4;
  }
  font-family: Pixel;
  font-size: 14px;
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  width: 70px;
  padding: 5px;
  pointer-events: auto;
  margin: 5px;
`;

const Scrollable = styled.div`
  overflow-y: scroll;
  height: 100%;
  max-height: 100%;
`;

const Card = styled.div`
  background-color: #fff;
  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  color: black;
  margin: 0px 2px 4px 2px;

  display: flex;
  flex-flow: row nowrap;
`;

const Image = styled.img`
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
  height: 110px;
  margin: 0px;
  padding: 0px;

  &:hover {
    opacity: 0.75;
  }
`;

const Container = styled.div`
  border-color: black;
  border-width: 2px;
  color: black;
  margin: 0px;
  padding: 0px;
  flex-grow: 1;

  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
`;

const TitleBar = styled.div`
  border-style: solid;
  border-width: 0px 0px 2px 0px;
  border-color: black;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const TitleText = styled.p`
  padding: 6px 9px;

  font-family: Pixel;
  font-size: 14px;
  text-align: left;
  justify-content: flex-start;

  &:hover {
    opacity: 0.6;
  }
`;

const Content = styled.div`
  flex-grow: 1;

  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
`;

const TopButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  width: 30px;
  &:active {
    background-color: #c4c4c4;
  }
  margin: 0px;
`;
