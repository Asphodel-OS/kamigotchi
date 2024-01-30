import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { registerUIComponent } from 'layers/react/engine/store';
import { EntityID, EntityIndex, Has, HasValue, runQuery } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import { useAccount, useContractRead, useBalance } from 'wagmi';
import crypto from "crypto";

import { abi } from "abi/Pet721ProxySystem.json"
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { getAccount, getAccountFromBurner } from 'layers/network/shapes/Account';
import { getConfigFieldValue } from 'layers/network/shapes/Config';
import { getData } from 'layers/network/shapes/Data';
import { GachaCommit, isGachaAvailable, queryGachaKamis, calcRerollCost } from 'layers/network/shapes/Gacha';
import { useVisibility } from 'layers/react/store/visibility';
import { useAccount as useKamiAccount } from 'layers/react/store/account';
import { useNetwork } from 'layers/react/store/network';
import { playVending } from 'utils/sounds';
import { Kami } from 'layers/network/shapes/Kami';

import { Tabs } from './Tabs';
import { Pool } from './Pool';
import { Reroll } from './Reroll';

export function registerGachaModal() {
  registerUIComponent(
    'KamiMint',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 20,
      rowEnd: 90,
    },
    (layers) => {
      const { network } = layers;
      const {
        AccountID,
        IsPet,
        RevealBlock,
        State,
      } = network.components;

      return merge(AccountID.update$, IsPet.update$, RevealBlock.update$, State.update$).pipe(
        map(() => {
          const account = getAccountFromBurner(
            network,
            { gacha: true, kamis: true },
          );

          const commits = [...account.gacha ? account.gacha.commits : []].reverse();

          return {
            network,
            data: {
              account: {
                kamis: account.kamis,
                mint20: {
                  minted: getData(network, account.id, "MINT20_MINT"),
                  limit: getConfigFieldValue(network, "MINT_ACCOUNT_MAX"),
                },
                commits: commits,
              },
            }
          };
        })
      );
    },

    ({ network, data }) => {
      const {
        actions,
        api: { player },
        systems,
        world,
        network: { blockNumber$ }
      } = network;

      const { isConnected } = useAccount();
      const { modals, setModals } = useVisibility();
      const { account: kamiAccount } = useKamiAccount();
      const { selectedAddress, networks } = useNetwork();

      // revealing
      const [triedReveal, setTriedReveal] = useState(true);
      const [waitingToReveal, setWaitingToReveal] = useState(false);
      const [blockNumber, setBlockNumber] = useState(0);

      // modal management
      const [tab, setTab] = useState('MINT');

      //////////////
      // HOOKS 

      useEffect(() => {
        const sub = blockNumber$.subscribe((block) => {
          setBlockNumber(block);
        });

        return () => sub.unsubscribe();
      }, []);

      useEffect(() => {
        const tx = async () => {
          if (isConnected && !triedReveal) {
            setTriedReveal(true);
            // wait to give buffer for OP rpc
            await new Promise((resolve) => setTimeout(resolve, 500));
            const filtered = data.account.commits.filter((n) => {
              return isGachaAvailable(n, blockNumber);
            });
            revealTx(filtered);
            if (waitingToReveal) {
              setWaitingToReveal(false);
              setModals({ ...modals, kamiMint: false, party: true });
            }
          }
        }
        tx();

      }, [data.account.commits]);


      //////////////////
      // CALCULATIONS

      const getRerollCost = (kami: Kami) => {
        return calcRerollCost(network, kami);
      }

      ///////////////
      // COUNTER

      const { data: mint20Addy } = useContractRead({
        address: systems["system.Mint20.Proxy"].address as `0x${string}`,
        abi: abi,
        functionName: 'getTokenAddy'
      });

      const { data: mint20Bal } = useBalance({
        address: kamiAccount.ownerAddress as `0x${string}`,
        token: mint20Addy as `0x${string}`,
        watch: true
      });




      /////////////////
      // ACTIONS

      const handleMint = (amount: number) => async () => {
        try {
          setWaitingToReveal(true);
          const mintActionID = mintTx(amount);
          await waitForActionCompletion(
            actions!.Action,
            world.entityToIndex.get(mintActionID) as EntityIndex
          );
          setTriedReveal(false);
          playVending();
        } catch (e) {
          console.log('KamiMint.tsx: handleMint() mint failed', e);
        }
      };

      const handleReroll = (kamis: Kami[]) => async () => {
        if (kamis.length === 0) return;
        try {
          setWaitingToReveal(true);
          const mintActionID = rerollTx(kamis);
          await waitForActionCompletion(
            actions!.Action,
            world.entityToIndex.get(mintActionID) as EntityIndex
          );
          setTriedReveal(false);
          playVending();
        } catch (e) {
          console.log('KamiReroll.tsx: handleReroll() reroll failed', e);
        }
      };

      // get a pet from gacha with Mint20
      const mintTx = (amount: number) => {
        const network = networks.get(selectedAddress);
        const api = network!.api.player;

        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiMint',
          params: [amount],
          description: `Minting ${amount} Kami`,
          execute: async () => {
            return api.mint.mintPet(amount);
          },
        });
        return actionID;
      };

      // reroll a pet with eth payment
      const rerollTx = (kamis: Kami[]) => {
        const network = networks.get(selectedAddress);
        const api = network!.api.player;

        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiReroll',
          params: [kamis.map((n) => n.name)],
          description: `Rerolling ${kamis.length} Kami`,
          execute: async () => {
            return api.mint.reroll(kamis.map((n) => n.id));
          },
        });
        return actionID;
      }

      // reveal gacha result(s)
      const revealTx = async (commits: GachaCommit[]) => {
        const toReveal = commits.map((n) => n.id);
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiReveal',
          params: [commits.length],
          description: `Revealing ${commits.length} Gacha rolls`,
          execute: async () => {
            return player.mint.reveal(toReveal);
          },
        });

        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
      };


      ///////////////
      // QUERIES

      const getAllPoolKamis = () => { return queryGachaKamis(network, { traits: true }) };

      ///////////////
      // DISPLAY

      const TabsBar = (<Tabs tab={tab} setTab={setTab} />);

      const MainDisplay = () => {
        if (tab === 'MINT') return (
          <Pool
            actions={{ handleMint }}
            data={{
              account: { balance: Number(mint20Bal?.formatted || '0') },
              pool: { kamis: queryGachaKamis(network, { traits: true }) }
            }}
            display={{ Tab: TabsBar }}
          />
        );
        else if (tab === 'REROLL') return (
          <Reroll
            actions={{ handleReroll }}
            data={{
              kamis: data.account.kamis || [],
              balance: Number(mint20Bal?.formatted || '0')
            }}
            display={{ Tab: TabsBar }}
            utils={{ getRerollCost }}
          />
        );
        else return <div />;
      }

      return (
        <ModalWrapper
          divName='gacha'
          id='gacha'
          header={<ModalHeader title='Gacha' icon={'https://kamigotchi.nyc3.digitaloceanspaces.com/placeholder.gif'} />}
          canExit
        >
          {MainDisplay()}
        </ModalWrapper>
      );
    }
  );
}

const Grid = styled.div`
  display: grid;
  grid-row-gap: 6px;
  grid-column-gap: 12px;
  justify-items: center;
  justify-content: center;

  padding: 24px 6px;
  margin: 0px 6px;
`;

const Input = styled.input`
  width: 50%;

  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  justify-content: center;
  font-family: Pixel;

  border-width: 0px;
  padding: 6px;

  &:focus {
    outline: none;
  }

  ::-webkit-inner-spin-button{
    -webkit-appearance: none; 
    margin: 0; 
  }
  ::-webkit-outer-spin-button{
    -webkit-appearance: none; 
    margin: 0; 
  }  
`;

const KamiImage = styled.img`
  border-style: solid;
  border-width: 0px;
  border-color: black;
  height: 90px;
  margin: 0px;
  padding: 0px;
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
  max-width: 75%;
`;

const SubHeader = styled.p`
  color: #333;

  padding: 1.5vw;
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;

const SubText = styled.div`
  font-size: 12px;
  color: #000;
  text-align: center;
  padding: 4px 6px 0px 6px;
  font-family: Pixel;
`;

const QuantityStepper = styled.button`
  font-size: 16px;
  color: #777;
  text-align: center;
  font-family: Pixel;

  border-style: none;
  background-color: transparent;

  &:hover {
    color: #000;  
  }
`;
