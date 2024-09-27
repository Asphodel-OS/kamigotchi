import { EntityID, EntityIndex } from '@mud-classic/recs';
import { registerUIComponent } from 'app/root';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { erc20Abi } from 'viem';
import { useBalance, useBlockNumber, useReadContracts } from 'wagmi';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useNetwork, useVisibility } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';
import { getConfigFieldValueAddress } from 'network/shapes/Config/types';
import { GACHA_ID, calcRerollCost, queryGachaCommits } from 'network/shapes/Gacha';
import { Kami, KamiOptions, queryKamisByAccount } from 'network/shapes/Kami';
import { BaseKami, getKami } from 'network/shapes/Kami/types';
import { Commit, filterRevealable } from 'network/shapes/utils';
import { parseTokenBalance } from 'utils/balances';
import { playVend } from 'utils/sounds';
import { MainDisplay } from './display/MainDisplay';
import { Panel } from './panel/Panel';
import { Commits } from './reroll/Commits';
import { Reroll } from './reroll/Reroll';
import { DefaultSorts, Filter, MYSTERY_KAMI_GIF, Sort, TabType } from './types';

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
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const account = getAccountFromBurner(network, {
            kamis: { traits: true, rerolls: true },
          });

          return {
            network,
            data: {
              account,
              accKamis: account.kamis,
              partyKamis: queryKamisByAccount(components, account.id),
              poolKamis: queryKamisByAccount(components, GACHA_ID),
              commits: queryGachaCommits(world, components, account.id),
              mint20Addy: getConfigFieldValueAddress(world, components, 'MINT20_ADDRESS'),
            },
            utils: {
              getKami: (entity: EntityIndex, options?: KamiOptions) =>
                getKami(world, components, entity, options),
              getBaseKami: (entity: EntityIndex) => getKami(world, components, entity),
            },
          };
        })
      ),
    ({ network, data, utils }) => {
      const { actions, components, world, api } = network;
      const { account, accKamis, commits, poolKamis, partyKamis, mint20Addy } = data;
      const { modals, setModals } = useVisibility();
      const { selectedAddress, apis } = useNetwork();
      const { data: blockNumber } = useBlockNumber({ watch: true });

      // modal state controls
      const [tab, setTab] = useState<TabType>('MINT');
      const [filters, setFilters] = useState<Filter[]>([]);
      const [sorts, setSorts] = useState<Sort[]>([DefaultSorts[0]]);
      const [limit, setLimit] = useState(20);

      const [triedReveal, setTriedReveal] = useState(true);
      const [waitingToReveal, setWaitingToReveal] = useState(false);
      const [gachaBalance, setGachaBalance] = useState(0);
      const [kamiCache, _] = useState<Map<EntityIndex, Kami>>(new Map());
      const [kamiBlockCache, __] = useState<Map<EntityIndex, JSX.Element>>(new Map());

      /////////////////
      // SUBSCRIPTIONS

      // Owner ETH Balance
      const { data: ownerEthBalance } = useBalance({
        address: account.ownerEOA as `0x${string}`,
      });

      // $KAMI Balance of Owner EOA
      const { data: mint20Balance, refetch: refetchMint20Balance } = useReadContracts({
        contracts: [
          {
            abi: erc20Abi,
            address: mint20Addy as `0x${string}`,
            functionName: 'balanceOf',
            args: [account.ownerEOA as `0x${string}`],
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
          `\n • ticket address: ${mint20Addy}`,
          `\n • modal ${modals.gacha ? 'open' : 'closed'}`
        );
        if (!mint20Addy || !modals.gacha || !account.ownerEOA) return;
        console.log('refetching gacha ticket balance..');
        refetchMint20Balance();
      }, [mint20Addy, modals.gacha, account.ownerEOA]);

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
        setModals({ party: true });
        setWaitingToReveal(false);
      }, [waitingToReveal]);

      // reveal gacha result(s) when the number of commits changes
      // Q(jb): is it necessary to run this as an async
      useEffect(() => {
        const tx = async () => {
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
          params: commits,
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
              title={`Gacha (${poolKamis.length} kamis in pool)`}
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
              controls={{ limit, filters, sorts }}
              caches={{ kamis: kamiCache, kamiBlocks: kamiBlockCache }}
              data={{ poolEntities: poolKamis, partyEntities: partyKamis }}
              utils={utils}
            />
            <Panel
              tab={tab}
              setTab={setTab}
              gachaBalance={gachaBalance}
              actions={{ mint: handleMint, reroll: handleReroll }}
              controls={{
                limit,
                setLimit,
                filters,
                setFilters,
                sorts,
                setSorts,
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
