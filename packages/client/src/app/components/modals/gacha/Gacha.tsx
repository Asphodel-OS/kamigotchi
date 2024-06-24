import { EntityID, EntityIndex } from '@mud-classic/recs';
import { registerUIComponent } from 'app/root';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';
import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
  useWatchBlockNumber,
} from 'wagmi';

import { abi as Mint20ProxySystemABI } from 'abi/Mint20ProxySystem.json';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useAccount as useKamiAccount, useNetwork, useVisibility } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';
import { GACHA_ID, GachaCommit, calcRerollCost, isGachaAvailable } from 'network/shapes/Gacha';
import { Kami } from 'network/shapes/Kami';
import { playVend } from 'utils/sounds';
import { erc20Abi, formatUnits } from 'viem';
import { Commits } from './Commits';
import { Pool } from './Pool';
import { Reroll } from './Reroll';
import { Tabs } from './Tabs';
import { getLazyKamis } from './utils/queries';

export function registerGachaModal() {
  registerUIComponent(
    'Gacha',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 20,
      rowEnd: 90,
    },
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const account = getAccountFromBurner(network, { gacha: true, kamis: true });

          const commits = [...(account.gacha ? account.gacha.commits : [])].reverse();

          return {
            network,
            data: {
              accKamis: account.kamis,
              gachaKamis: getLazyKamis(world, components)(
                { account: GACHA_ID as EntityID },
                { traits: true }
              ),
              commits: commits,
            },
          };
        })
      ),
    ({ network, data }) => {
      const {
        actions,
        components,
        world,
        api: { player },
      } = network;
      const { isConnected } = useAccount();
      const { modals, setModals } = useVisibility();
      const { account: kamiAccount } = useKamiAccount();
      const { selectedAddress, apis } = useNetwork();

      const [triedReveal, setTriedReveal] = useState(true);
      const [waitingToReveal, setWaitingToReveal] = useState(false);
      const [tab, setTab] = useState('MINT');
      const [blockNumber, setBlockNumber] = useState(BigInt(0));

      /////////////////
      // SUBSCRIPTIONS

      useWatchBlockNumber({
        onBlockNumber: (n) => {
          refetchOwnerMint20Balance();
          refetchOwnerEthBalance();
          setBlockNumber(n);
        },
      });

      // Owner ETH Balance
      const { data: ownerEthBalance, refetch: refetchOwnerEthBalance } = useBalance({
        address: kamiAccount.ownerAddress as `0x${string}`,
      });

      // $KAMI Contract Address
      const { data: mint20Addy } = useReadContract({
        address: network.systems['system.Mint20.Proxy']?.address as `0x${string}`,
        abi: Mint20ProxySystemABI,
        functionName: 'getTokenAddy',
      });

      // $KAMI Balance of Owner EOA
      const { data: ownerMint20Balance, refetch: refetchOwnerMint20Balance } = useReadContracts({
        contracts: [
          {
            abi: erc20Abi,
            address: mint20Addy as `0x${string}`,
            functionName: 'balanceOf',
            args: [kamiAccount.ownerAddress as `0x${string}`],
          },
          {
            abi: erc20Abi,
            address: mint20Addy as `0x${string}`,
            functionName: 'decimals',
          },
        ],
      });

      //////////////
      // TRACKING

      useEffect(() => {
        const tx = async () => {
          if (!isConnected) return;

          const filtered = data.commits.filter((n) => isGachaAvailable(n, Number(blockNumber)));
          if (!triedReveal && filtered.length > 0) {
            try {
              // wait to give buffer for OP rpc
              await new Promise((resolve) => setTimeout(resolve, 500));

              revealTx(filtered);
              setTriedReveal(true);
            } catch (e) {
              console.log('Gacha.tsx: handleMint() reveal failed', e);
            }
            if (waitingToReveal) {
              setWaitingToReveal(false);
              setModals({ ...modals, party: true });
            }
          }
        };

        tx();
      }, [data.commits]);

      //////////////////
      // INTERPRETATION

      const getRerollCost = (kami: Kami) => {
        return calcRerollCost(world, components, kami);
      };

      // parses a wagmi FetchBalanceResult
      const parseTokenBalance = (balance: bigint = BigInt(0), decimals: number = 18) => {
        const formatted = formatUnits(balance, decimals);
        return Number(formatted);
      };

      /////////////////
      // ACTIONS

      // get a pet from gacha with Mint20
      const mintTx = (amount: number) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
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
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiReroll',
          params: [kamis.map((n) => n.name)],
          description: `Rerolling ${kamis.length} Kami`,
          execute: async () => {
            return api.mint.reroll(
              kamis.map((n) => n.id),
              price
            );
          },
        });
        return actionID;
      };

      // reveal gacha result(s)
      const revealTx = async (commits: GachaCommit[]) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const toReveal = commits.map((n) => n.id);
        const actionID = uuid() as EntityID;
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
      // HANDLERS

      const handleMint = (amount: number) => async () => {
        try {
          setWaitingToReveal(true);
          const mintActionID = mintTx(amount);
          if (!mintActionID) throw new Error('Mint reveal failed');

          await waitForActionCompletion(
            actions!.Action,
            world.entityToIndex.get(mintActionID) as EntityIndex
          );
          setTriedReveal(false);
          playVend();
        } catch (e) {
          console.log('Gacha.tsx: handleMint() mint failed', e);
        }
      };

      const handleReroll = (kamis: Kami[], price: bigint) => async () => {
        if (kamis.length === 0) return;
        try {
          setWaitingToReveal(true);
          const rerollActionID = rerollTx(kamis, price);
          if (!rerollActionID) throw new Error('Reroll action failed');

          await waitForActionCompletion(
            actions!.Action,
            world.entityToIndex.get(rerollActionID) as EntityIndex
          );
          setTriedReveal(false);
          playVend();
        } catch (e) {
          console.log('KamiReroll.tsx: handleReroll() reroll failed', e);
        }
      };

      ///////////////
      // DISPLAY

      const TabsBar = (
        <Tabs
          tab={tab}
          setTab={setTab}
          commits={data.commits.length}
          gachaBalance={data.gachaKamis.length}
        />
      );

      const MainDisplay = () => {
        if (tab === 'MINT')
          return (
            <Pool
              actions={{ handleMint }}
              data={{
                account: {
                  balance: parseTokenBalance(
                    ownerMint20Balance?.[0]?.result,
                    ownerMint20Balance?.[1]?.result
                  ),
                },
                lazyKamis: data.gachaKamis,
              }}
            />
          );
        else if (tab === 'REROLL')
          return (
            <Reroll
              actions={{ handleReroll }}
              data={{
                kamis: data.accKamis || [],
                balance: ownerEthBalance?.value || 0n, // bigint used for dealing with wei
              }}
              utils={{ getRerollCost }}
            />
          );
        else if (tab === 'COMMITS')
          return (
            <Commits
              actions={{ revealTx }}
              data={{
                commits: data.commits || [],
                blockNumber: Number(blockNumber),
              }}
            />
          );
        else return <div />;
      };

      return (
        <ModalWrapper
          id='gacha'
          header={
            <ModalHeader
              title='Gacha'
              icon={'https://kamigotchi.nyc3.digitaloceanspaces.com/placeholder.gif'}
            />
          }
          canExit
        >
          {TabsBar}
          {MainDisplay()}
        </ModalWrapper>
      );
    }
  );
}
