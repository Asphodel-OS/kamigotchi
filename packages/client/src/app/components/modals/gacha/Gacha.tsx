import { EntityID, EntityIndex } from '@mud-classic/recs';
import { registerUIComponent } from 'app/root';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { useAccount, useBalance, useReadContract, useReadContracts } from 'wagmi';

import { abi as Mint20ProxySystemABI } from 'abi/Mint20ProxySystem.json';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useAccount as useKamiAccount, useNetwork, useVisibility } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';
import { GACHA_ID, calcRerollCost, queryGachaCommits } from 'network/shapes/Gacha';
import { Kami, getLazyKamis } from 'network/shapes/Kami';
import { Commit, filterRevealable } from 'network/shapes/utils';
import { parseTokenBalance } from 'utils/balances';
import { playVend } from 'utils/sounds';
import { erc20Abi } from 'viem';
import { Pool } from './pool/Pool';
import { Commits } from './roller/Commits';
import { Reroll } from './roller/Reroll';
import { Tabs } from './Tabs';

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
          const account = getAccountFromBurner(network, {
            kamis: { traits: true, rerolls: true },
          });

          const commits = queryGachaCommits(world, components, account.id);

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
      const [gachaBalance, setGachaBalance] = useState(0);

      /////////////////
      // SUBSCRIPTIONS

      // Owner ETH Balance
      const { data: ownerEthBalance } = useBalance({
        address: kamiAccount.ownerAddress as `0x${string}`,
      });

      // $KAMI Contract Address
      const { data: mint20Addy } = useReadContract({
        address: network.systems['system.Mint20.Proxy']?.address as `0x${string}`,
        abi: Mint20ProxySystemABI,
        functionName: 'getTokenAddy',
      });

      // $KAMI Balance of Owner EOA
      const { data: mint20Balance, refetch: refetchMint20Balance } = useReadContracts({
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

      // refetch the mint20 balance whenever the wallet connects or contract address changes
      useEffect(() => {
        console.log('connected', isConnected, mint20Addy);
        if (!isConnected || !mint20Addy) return;
        refetchMint20Balance();
      }, [isConnected, mint20Addy]);

      // update the gacha balance whenever the mint20 balance changes
      useEffect(() => {
        if (!mint20Balance || !mint20Balance[0]) return;
        const raw = mint20Balance[0]?.result ?? BigInt(0);
        const decimals = mint20Balance[1]?.result ?? 18;
        const balance = parseTokenBalance(raw, decimals);
        if (balance != gachaBalance) setGachaBalance(balance);
      }, [mint20Balance]);

      useEffect(() => {
        const tx = async () => {
          if (!isConnected) return;

          const filtered = filterRevealable(data.commits, Number(blockNumber));
          if (!triedReveal && filtered.length > 0) {
            try {
              // wait to give buffer for rpc
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
      const revealTx = async (commits: Commit[]) => {
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
                    mint20Balance?.[0]?.result,
                    mint20Balance?.[1]?.result
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
                kamis: data.accKamis.filter((kami) => kami.state === 'RESTING') || [],
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
