import { EntityID, EntityIndex } from '@mud-classic/recs';
import { registerUIComponent } from 'app/root';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { useBalance, useBlockNumber } from 'wagmi';

import { getAccountKamis } from 'app/cache/account';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useNetwork, useVisibility } from 'app/stores';
import { GACHA_TICKET_INDEX } from 'constants/items';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getConfigFieldValue, getConfigFieldValueAddress } from 'network/shapes/Config';
import { GACHA_ID, calcRerollCost, queryGachaCommits } from 'network/shapes/Gacha';
import { getItemBalance } from 'network/shapes/Item';
import { BaseKami, GachaKami, Kami, getGachaKami, queryKamis } from 'network/shapes/Kami';
import { Commit, filterRevealable } from 'network/shapes/utils';
import { getOwnerAddress } from 'network/shapes/utils/component';
import { playVend } from 'utils/sounds';
import { MainDisplay } from './display/MainDisplay';
import { Panel } from './panel/Panel';
import { DefaultSorts, Filter, MYSTERY_KAMI_GIF, Sort, TabType } from './types';

// TODO: rely on cache for these instead
const kamiCache = new Map<EntityIndex, GachaKami>();
const kamiBlockCache = new Map<EntityIndex, JSX.Element>();

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
          const accountEntity = queryAccountFromEmbedded(network);
          const accountID = world.entities[accountEntity];

          // TODO: boot the poolKamis query to MainDisplay once we consolidate tab views under it
          return {
            network,
            data: {
              accountEntity,
              ownerAddress: getOwnerAddress(components, accountEntity),
              gachaBalance: getItemBalance(world, components, accountID, GACHA_TICKET_INDEX),
              poolKamis: queryKamis(components, { account: GACHA_ID }),
              commits: queryGachaCommits(world, components, accountID),
              maxRerolls: getConfigFieldValue(world, components, 'GACHA_MAX_REROLLS'),
              onyxAddress: getConfigFieldValueAddress(world, components, 'ONYX_ADDRESS'),
            },
            utils: {
              getGachaKami: (entity: EntityIndex) => getGachaKami(world, components, entity),
              getAccountKamis: () =>
                getAccountKamis(world, components, accountEntity, { live: 0, rerolls: 0 }),
              getRerollCost: (kami: Kami) => calcRerollCost(world, components, kami),
            },
          };
        })
      ),
    ({ network, data, utils }) => {
      const { actions, world, api } = network;
      const { ownerAddress, commits, gachaBalance, poolKamis } = data;
      const { setModals } = useVisibility();
      const { selectedAddress, apis } = useNetwork();
      const { data: blockNumber } = useBlockNumber({ watch: true });

      // modal state controls
      const [tab, setTab] = useState<TabType>('MINT');
      const [filters, setFilters] = useState<Filter[]>([]);
      const [sorts, setSorts] = useState<Sort[]>([DefaultSorts[0]]);
      const [limit, setLimit] = useState(20);

      const [triedReveal, setTriedReveal] = useState(true);
      const [waitingToReveal, setWaitingToReveal] = useState(false);

      /////////////////
      // SUBSCRIPTIONS

      // Owner ETH Balance
      const { data: ownerEthBalance } = useBalance({
        address: ownerAddress as `0x${string}`,
      });

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
              await new Promise((resolve) => setTimeout(resolve, 750));
              revealTx(filtered);
              setTriedReveal(true);
            } catch (e) {
              console.log('Gacha.tsx: handleMint() reveal failed', e);
            }
          }
        };

        tx();
      }, [commits]);

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
            return api.mint.reroll(kamis.map((n) => n.id));
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
          return true;
        } catch (e) {
          console.log('Gacha.tsx: handleMint() mint failed', e);
        }
        return false;
      };

      const handleReroll = async (kamis: BaseKami[], price: bigint) => {
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
            <MainDisplay
              tab={tab}
              blockNumber={blockNumber ?? 0n}
              controls={{ limit, filters, sorts }}
              actions={{ handleReroll, revealTx }}
              caches={{ kamis: kamiCache, kamiBlocks: kamiBlockCache }}
              data={{ ...data, balance: ownerEthBalance?.value ?? 0n }}
              utils={utils}
              networkActions={actions}
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
