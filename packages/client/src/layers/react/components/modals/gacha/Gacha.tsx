import React, { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { registerUIComponent } from 'layers/react/engine/store';
import { EntityID, EntityIndex } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import { useAccount, useContractRead, useBalance } from 'wagmi';
import crypto from "crypto";

import { Pool } from './Pool';
import { Reroll } from './Reroll';
import { Commits } from './Commits';
import { Tabs } from './components/Tabs';
import { getLazyKamis } from './utils/queries';
import { abi } from "abi/Pet721ProxySystem.json"
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { GachaCommit, isGachaAvailable, calcRerollCost } from 'layers/network/shapes/Gacha';
import { Kami } from 'layers/network/shapes/Kami';
import { ModalHeader, ModalWrapper } from 'layers/react/components/library';
import { useAccount as useKamiAccount } from 'layers/react/store/account';
import { useVisibility } from 'layers/react/store/visibility';
import { useNetwork } from 'layers/react/store/network';
import { playVending } from 'utils/sounds';


export function registerGachaModal() {
  registerUIComponent(
    'Gacha',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 20,
      rowEnd: 90,
    },
    (layers) => {
      const { network } = layers;

      return interval(1000).pipe(
        map(() => {
          const account = getAccountFromBurner(
            network,
            { gacha: true, kamis: true },
          );

          const commits = [...account.gacha ? account.gacha.commits : []].reverse();

          return {
            network,
            data: {
              kamis: account.kamis,
              commits: commits,
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
            const filtered = data.commits.filter((n) => {
              return isGachaAvailable(n, blockNumber);
            });
            revealTx(filtered);
            if (waitingToReveal) {
              setWaitingToReveal(false);
              setModals({ ...modals, party: true });
            }
          }
        }
        tx();

      }, [data.commits]);


      //////////////////
      // CALCULATIONS

      const getRerollCost = (kami: Kami) => {
        return calcRerollCost(network, kami);
      }

      ///////////////
      // COUNTER

      const { data: mint20Addy } = useContractRead({
        address: systems["system.Mint20.Proxy"]?.address as `0x${string}`,
        abi: abi,
        functionName: 'getTokenAddy'
      });

      const { data: mint20Bal } = useBalance({
        address: kamiAccount.ownerAddress as `0x${string}`,
        token: mint20Addy as `0x${string}`,
        watch: true
      });

      const { data: ethBal } = useBalance({
        address: kamiAccount.ownerAddress as `0x${string}`,
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
          console.log('Gacha.tsx: handleMint() mint failed', e);
        }
      };

      const handleReroll = (kamis: Kami[], price: bigint) => async () => {
        if (kamis.length === 0) return;
        try {
          setWaitingToReveal(true);
          const mintActionID = rerollTx(kamis, price);
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
      const rerollTx = (kamis: Kami[], price: bigint) => {
        const network = networks.get(selectedAddress);
        const api = network!.api.player;

        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiReroll',
          params: [kamis.map((n) => n.name)],
          description: `Rerolling ${kamis.length} Kami`,
          execute: async () => {
            return api.mint.reroll(kamis.map((n) => n.id), price);
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
      // DISPLAY

      const TabsBar = (<Tabs
        tab={tab}
        setTab={setTab}
        commits={data.commits.length}
      />);

      const MainDisplay = () => {
        if (tab === 'MINT') return (
          <Pool
            actions={{ handleMint }}
            data={{
              account: { balance: Number(mint20Bal?.formatted || '0') },
            }}
            display={{ Tab: TabsBar }}
            query={{ getLazyKamis: getLazyKamis(network) }}
          />
        );
        else if (tab === 'REROLL') return (
          <Reroll
            actions={{ handleReroll }}
            data={{
              kamis: data.kamis || [],
              balance: ethBal?.value || 0n  // bigint used for dealing with wei
            }}
            display={{ Tab: TabsBar }}
            utils={{ getRerollCost }}
          />
        );
        else if (tab === 'COMMITS') return (
          <Commits
            actions={{ revealTx }}
            data={{
              commits: data.commits || [],
              blockNum: blockNumber
            }}
            display={{ Tab: TabsBar }}
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
