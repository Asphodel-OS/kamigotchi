import { EntityID, EntityIndex } from '@mud-classic/recs';
import { registerUIComponent } from 'app/root';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { erc20Abi } from 'viem';
import { useAccount, useBalance, useBlockNumber, useReadContract, useReadContracts } from 'wagmi';

import { abi as Mint20ProxySystemABI } from 'abi/Mint20ProxySystem.json';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useAccount as useKamiAccount, useNetwork, useVisibility } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';
import { GACHA_ID, calcRerollCost, queryGachaCommits } from 'network/shapes/Gacha';
import { Kami, getLazyKamis, queryKamisByAccount } from 'network/shapes/Kami';
import { BaseKami } from 'network/shapes/Kami/types';
import { Commit, filterRevealable } from 'network/shapes/utils';
import { parseTokenBalance } from 'utils/balances';
import { playVend } from 'utils/sounds';
import { MainDisplay } from './display/MainDisplay';
import { Panel } from './panel/Panel';
import { Commits } from './reroll/Commits';
import { Reroll } from './reroll/Reroll';
import { Filter, MYSTERY_KAMI_GIF, Sort, TabType } from './types';

const MINT20PROXY_KEY = 'system.Mint20.Proxy';

export function registerGachaModal() {
  registerUIComponent(
    'Gacha',
    {
      colStart: 11,
      colEnd: 89,
      rowStart: 8,
      rowEnd: 85,
    },
    (layers) =>
      interval(2000).pipe(
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
              kamiEntities: queryKamisByAccount(components, GACHA_ID),
              commits,
            },
          };
        })
      ),
    ({ network, data }) => {
      const { actions, components, world, api } = network;
      const { accKamis, commits, gachaKamis, kamiEntities } = data;
      const { isConnected } = useAccount();
      const { account } = useKamiAccount();
      const { modals, setModals } = useVisibility();
      const { selectedAddress, apis } = useNetwork();
      const { data: blockNumber } = useBlockNumber({ watch: true });

      const [triedReveal, setTriedReveal] = useState(true);
      const [waitingToReveal, setWaitingToReveal] = useState(false);
      const [gachaBalance, setGachaBalance] = useState(0);

      // modal state controls
      const [tab, setTab] = useState<TabType>('MINT');
      const [filters, setFilters] = useState<Filter[]>([]);
      const [sorts, setSorts] = useState<Sort[]>([]);
      const [limit, setLimit] = useState(20);
      console.log(filters);

      /////////////////
      // SUBSCRIPTIONS

      // Owner ETH Balance
      const { data: ownerEthBalance } = useBalance({
        address: account.ownerAddress as `0x${string}`,
      });

      // $KAMI Contract Address
      const { data: mint20Addy } = useReadContract({
        address: network.systems[MINT20PROXY_KEY]?.address as `0x${string}`,
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
            args: [account.ownerAddress as `0x${string}`],
          },
          {
            abi: erc20Abi,
            address: mint20Addy as `0x${string}`,
            functionName: 'decimals',
          },
        ],
      });

      // refetch the mint20 balance whenever the wallet connects or contract address changes
      useEffect(() => {
        console.log(
          `gacha state updated:`,
          `\n • connected: ${isConnected}`,
          `\n • address: ${mint20Addy}`,
          `\n • modal ${modals.gacha ? 'open' : 'closed'}`
        );
        if (!isConnected || !mint20Addy || !modals.gacha) return;
        console.log('refetching gacha ticket balance..');
        refetchMint20Balance();
      }, [isConnected, mint20Addy, modals.gacha]);

      // update the gacha balance whenever the result changes
      useEffect(() => {
        if (!mint20Balance || !mint20Balance[0]) return;
        if (mint20Balance[0].error) {
          const error = mint20Balance[0].error;
          return console.warn(`${error.name} on Gacha Modal:\n${error.message}`);
        }

        const raw = mint20Balance[0]?.result ?? BigInt(0);
        const decimals = mint20Balance[1]?.result ?? 18;
        const newBalance = parseTokenBalance(raw, decimals);

        if (newBalance != gachaBalance) setGachaBalance(newBalance);
      }, [mint20Balance]);

      // open the party modal when the reveal is triggered
      useEffect(() => {
        if (!waitingToReveal) return;
        setModals({ ...modals, party: true });
        setWaitingToReveal(false);
      }, [waitingToReveal]);

      // reveal gacha result(s) when the number of commits changes
      // Q(jb): is it necessary to run this as an async
      useEffect(() => {
        const tx = async () => {
          if (!isConnected) return;

          const filtered = filterRevealable(commits, Number(blockNumber));
          if (!triedReveal && filtered.length > 0) {
            try {
              // wait to give buffer for rpc
              await new Promise((resolve) => setTimeout(resolve, 500));
              revealTx(filtered);
              setTriedReveal(true);
            } catch (e) {
              console.log('Gacha.tsx: handleMint() reveal failed', e);
            }
          }
        };

        tx();
      }, [commits]);

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
      const rerollTx = (kamis: BaseKami[], price: bigint) => {
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
        const toReveal = commits.map((n) => n.id);
        const actionID = uuid() as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiReveal',
          params: [commits.length],
          description: `Revealing ${commits.length} Gacha rolls`,
          execute: async () => {
            return api.player.mint.reveal(toReveal);
          },
        });

        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
      };

      ///////////////
      // HANDLERS

      const handleMint = async (amount: number) => {
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

      const handleReroll = (kamis: BaseKami[], price: bigint) => async () => {
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

      const MainDisplay1 = () => {
        if (tab === 'REROLL')
          return (
            <Reroll
              actions={{ handleReroll }}
              data={{
                kamis: accKamis.filter((kami) => kami.state === 'RESTING') || [],
                balance: ownerEthBalance?.value || 0n, // bigint used for dealing with wei
              }}
              utils={{ getRerollCost }}
            />
          );
        else if (tab === 'REVEAL')
          return (
            <Commits
              actions={{ revealTx }}
              data={{
                commits: commits || [],
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
              title={`Gacha (${kamiEntities.length} kamis in pool)`}
              icon={MYSTERY_KAMI_GIF}
            />
          }
          canExit
          noPadding
          overlay
        >
          <Container>
            {MainDisplay1()}
            <MainDisplay
              tab={tab}
              actions={{ handleMint }}
              lazyKamis={gachaKamis}
              data={{ kamiEntities: kamiEntities }}
            />
            <Panel
              tab={tab}
              setTab={setTab}
              gachaBalance={gachaBalance}
              actions={{ mint: handleMint, reroll: handleReroll }}
              controls={{
                filters,
                setFilters,
                sorts,
                setSorts,
                limit,
                setLimit,
              }}
            />
          </Container>
        </ModalWrapper>
      );
    }
  );
}

const Container = styled.div`
  position: relative;
  height: 100%;

  display: flex;
  flex-direction: row;
`;
