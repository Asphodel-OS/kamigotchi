import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { getAccount, getAccountKamis } from 'app/cache/account';
import { getNodeByIndex } from 'app/cache/node';
import { HarvestButton, ModalHeader, ModalWrapper, UseItemButton } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useAccount, useVisibility } from 'app/stores';
import { KamiIcon } from 'assets/images/icons/menu';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { Node, NullNode } from 'network/shapes/Node';
import { KamiList } from './List';

const REFRESH_INTERVAL = 2000;

export function registerPartyModal() {
  registerUIComponent(
    'PartyModal',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 8,
      rowEnd: 99,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const { debug } = useAccount.getState();

          const accountEntity = queryAccountFromEmbedded(network);
          const accRefreshOptions = {
            live: 0,
            inventory: 2,
          };
          const kamiRefreshOptions = {
            live: 0,
            bonuses: 5, // set this to 3600 once we get explicit triggers for updates
            config: 3600,
            flags: 10, // set this to 3600 once we get explicit triggers for updates
            harvest: 5, // set this to 60 once we get explicit triggers for updates
            skills: 5, // set this to 3600 once we get explicit triggers for updates
            stats: 3600,
            traits: 3600,
          };

          return {
            network,
            data: {
              accountEntity,
            },
            display: {
              HarvestButton: (account: Account, kami: Kami, node: Node) =>
                HarvestButton({ network, account, kami, node }),
              UseItemButton: (kami: Kami, account: Account, icon: string) =>
                UseItemButton(network, kami, account, icon),
            },
            utils: {
              getAccount: () => getAccount(world, components, accountEntity, accRefreshOptions),
              getKamis: () =>
                getAccountKamis(world, components, accountEntity, kamiRefreshOptions, debug.cache),
              getNode: (index: number) => getNodeByIndex(world, components, index),
            },
          };
        })
      ),

    // Render
    ({ display, data, utils }) => {
      const { accountEntity } = data;
      const { getAccount, getKamis, getNode } = utils;
      const { modals } = useVisibility();

      const [account, setAccount] = useState<Account>(NullAccount);
      const [kamis, setKamis] = useState<Kami[]>([]);
      const [node, setNode] = useState<Node>(NullNode); // node of the current room
      const [tick, setTick] = useState(Date.now());

      // mounting
      useEffect(() => {
        // populate initial data
        const account = getAccount();
        setAccount(account);
        setKamis(getKamis());

        // set ticking
        const refreshClock = () => setTick(Date.now());
        const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
        return () => clearInterval(timerId);
      }, []);

      // update account and kamis every tick or if the connnected account changes
      useEffect(() => {
        if (!modals.party) return;
        const account = getAccount();
        setAccount(account);
        setKamis(getKamis());
      }, [modals.party, accountEntity, tick]);

      // update node if the account or room changes
      useEffect(() => {
        const room = account.roomIndex;
        setNode(getNode(room));
      }, [accountEntity, account.roomIndex]);

      return (
        <ModalWrapper
          id='party'
          header={<ModalHeader title='Party' icon={KamiIcon} />}
          canExit
          truncate
          noPadding
        >
          <KamiList data={{ account, kamis, node }} display={display} state={{ tick }} />
        </ModalWrapper>
      );
    }
  );
}
