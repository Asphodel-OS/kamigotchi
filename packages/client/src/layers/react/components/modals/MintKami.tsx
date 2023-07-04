/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useEffect } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { registerUIComponent } from 'layers/react/engine/store';
import { EntityID, EntityIndex, Has, HasValue, runQuery } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';

import { getAccount } from 'layers/react/components/shapes/Account';
import { Kami, queryKamisX } from 'layers/react/components/shapes/Kami';
import mintSound from 'assets/sound/fx/vending_machine.mp3';
import { dataStore } from 'layers/react/store/createStore';
import { useNetworkSettings } from 'layers/react/store/networkSettings';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { Stepper } from '../library/Stepper';

export function registerKamiMintModal() {
  registerUIComponent(
    'KamiMint',
    {
      colStart: 38,
      colEnd: 64,
      rowStart: 20,
      rowEnd: 78,
    },
    (layers) => {
      const {
        network: {
          network,
          components: {
            IsPet,
            IsAccount,
            OperatorAddress,
            State,
            Value,
          },
          world,
        },
      } = layers;

      return merge(IsPet.update$, Value.update$, State.update$).pipe(
        map(() => {
          // get the account through the account entity of the controlling wallet
          const accountIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];

          const account = getAccount(layers, accountIndex, { kamis: true });

          const unrevealedKamis = queryKamisX(
            layers,
            { account: account.id, state: 'UNREVEALED' }
          ).reverse();

          return {
            layers,
            unrevealedKamis,
          };
        })
      );
    },

    ({ layers, unrevealedKamis }) => {
      const {
        network: {
          actions,
          api: { player },
          world,
        },
      } = layers;

      const { visibleModals, setVisibleModals, sound: { volume } } = dataStore();
      const { selectedAddress, networks } = useNetworkSettings();

      useEffect(() => {
        unrevealedKamis.forEach((kami) => {
          revealTx(kami);
        });
      }, [unrevealedKamis])

      /////////////////
      // ACTIONS

      const mintTx = (amount: number, value: number) => {
        const network = networks.get(selectedAddress);
        const api = network!.api.player;

        const actionID = (amount == 1 ? `Minting Kami` : `Minting Kamis`) as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            // try whitelist mint if no ether is sent
            return (value == 0) ? api.ERC721.whitelistMint() : api.ERC721.mint(amount, value);
          },
        });
        return actionID;
      };

      const revealTx = async (kami: Kami) => {
        if (!kami.index) return;
        const actionID = (`Revealing Kami ` + BigInt(kami.index).toString(10)) as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return player.ERC721.reveal(kami.index);
          },
        });
        await waitForActionCompletion(
          actions.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
      };

      const handleMinting = (amount: number, value: number) => async () => {
        try {
          const mintActionID = mintTx(amount, value);
          await waitForActionCompletion(
            actions.Action,
            world.entityToIndex.get(mintActionID) as EntityIndex
          );
          setVisibleModals({ ...visibleModals, kamiMint: false, party: true });

          const mintFX = new Audio(mintSound);
          mintFX.volume = volume * 0.6;
          mintFX.play();
        } catch (e) {
          console.log('KamiMint.tsx: handleMinting() mint failed', e);
        }
      };

      ///////////////
      // DISPLAY

      const MintButton = (text: string, amount: number, cost: number) => {
        return (
          <ActionButton id='button-mint' onClick={handleMinting(amount, cost)} size='vending' text={text} inverted />
        );
      }

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, kamiMint: false });
      }, [setVisibleModals, visibleModals]);

      return (
        <ModalWrapperFull divName='kamiMint' id='kamiMintModal'>
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          <Stepper steps={steps} MintButton={MintButton} />
        </ModalWrapperFull>
      );
    }
  );
}

const StepOne = () => (
  <>
    <Description style={{ display: 'grid', height: '100%', alignContent: 'center' }}>
      <Header style={{ color: 'black' }}>Vending Machine</Header>
      <br />
      There's some sort of vending machine here. A machine for NFTs. You hope it can be trusted.
    </Description>
  </>
);

const StepTwo = (props: any) => {
  const { MintButton } = props;

  return (
    <>
      <Header style={{ color: 'black' }}>Vending Machine</Header>
      <Grid>
        <ProductBox style={{ gridRow: 2, gridColumn: 1 }}>
          <KamiImage src='https://kamigotchi.nyc3.digitaloceanspaces.com/placeholder.gif' />
          <VendingText>WL Kami</VendingText>
          {MintButton("0.000Ξ", 1, 0)}
        </ProductBox>
        <ProductBox style={{ gridRow: 2, gridColumn: 2 }}>
          <KamiImage src='https://kamigotchi.nyc3.digitaloceanspaces.com/placeholder.gif' />
          <VendingText>1 Kami</VendingText>
          {MintButton("0.015Ξ", 1, 0.015)}
        </ProductBox>
        <ProductBox style={{ gridRow: 3, gridColumn: 1 }}>
          <KamiImage src='https://kamigotchi.nyc3.digitaloceanspaces.com/placeholder.gif' />
          <VendingText>3 Kamis</VendingText>
          {MintButton("0.045Ξ", 3, 0.045)}
        </ProductBox>
        <ProductBox style={{ gridRow: 3, gridColumn: 2 }}>
          <KamiImage src='https://kamigotchi.nyc3.digitaloceanspaces.com/placeholder.gif' />
          <VendingText>5 Kamis</VendingText>
          {MintButton("0.075Ξ", 5, 0.075)}
        </ProductBox>
      </Grid>
    </>
  );
};

const steps = (props: any) => [
  {
    title: 'One',
    content: <StepOne />,
  },
  {
    title: 'Two',
    content: <StepTwo MintButton={props.MintButton} />,
    modalContent: true,
  },
];


const Description = styled.div`
  font-size: 20px;
  color: #333;
  text-align: center;
  padding: 10px;
  font-family: Pixel;
`;

const Header = styled.p`
  font-size: 24px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;

const Grid = styled.div`
  display: grid;
  grid-row-gap: 6px;
  grid-column-gap: 12px;
  justify-items: center;
  justify-content: center;
  padding: 24px 6px;
`;

const KamiImage = styled.img`
  border-style: solid;
  border-width: 0px;
  border-color: black;
  height: 90px;
  margin: 0px;
  padding: 0px;
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

const ProductBox = styled.div`
  border-color: black;
  border-radius: 2px;
  border-style: solid;
  border-width: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 5px;
`;

const VendingText = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;

  font-family: Pixel;
`;