import { EntityID, EntityIndex } from '@mud-classic/recs';
import { BigNumber } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { cleanInventories, Inventory } from 'app/cache/inventory';
import { EmptyText, IconListButton, TextTooltip } from 'app/components/library';
import { ButtonListOption } from 'app/components/library/buttons';
import { Option } from 'app/components/library/buttons/IconListButton';
import { useVisibility } from 'app/stores';
import { ItemTransfer } from 'clients/kamiden/proto';
import { formatEntityID } from 'engine/utils';
import { Account, NullAccount } from 'network/shapes/Account';
import { Allo } from 'network/shapes/Allo';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { DetailedEntity } from 'network/shapes/utils';
import { ItemGridTooltip } from './ItemGridTooltip';
import { Send } from './Send';

const EMPTY_TEXT = ['Inventory is empty.', 'Be less poore..'];
const REFRESH_INTERVAL = 2000;

// get the row of consumable items to display in the player inventory
export const ItemGrid = ({
  accountEntity,
  accounts,
  actions,
  data,
  utils,
}: {
  accountEntity: EntityIndex;
  accounts: Account[];
  actions: {
    useForAccount: (item: Item, amount: number) => void;
    useForKami: (kami: Kami, item: Item) => void;
    sendItemsTx: (items: Item[], amts: number[], account: Account) => void;
  };
  data: { showSend: boolean; sendHistory: ItemTransfer[] };
  utils: {
    meetsRequirements: (holder: Kami | Account, item: Item) => boolean;
    getAccount: (entityIndex: EntityIndex) => Account;
    getInventories: () => Inventory[];
    getKamis: () => Kami[];
    displayRequirements: (item: Item) => string;
    parseAllos: (allo: Allo[]) => DetailedEntity[];
    setShowSend: (show: boolean) => void;
    getInventoryBalance: (inventories: Inventory[], index: number) => number;
    getEntityIndex: (entity: EntityID) => EntityIndex;
    getItem: (index: EntityIndex) => Item;
  };
}) => {
  const {
    getAccount,
    getInventories,
    getKamis,
    meetsRequirements,
    setShowSend,
    getInventoryBalance,
    getEntityIndex,
    getItem,
  } = utils;
  const { showSend, sendHistory } = data;
  const { sendItemsTx } = actions;

  const { modals } = useVisibility();
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [account, setAccount] = useState<Account>(NullAccount);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [kamis, setKamis] = useState<Kami[]>([]);
  const [visible, setVisible] = useState(false);

  // refresh data whenever the modal is opened
  useEffect(() => {
    if (!modals.inventory) return;
    updateData();
  }, [modals.inventory, lastRefresh, accountEntity]);

  // update the inventory, account and kami data
  const updateData = () => {
    const account = getAccount(accountEntity);
    setAccount(account);

    // get, clean, and set account inventories
    const rawInventories = getInventories() ?? [];
    const inventories = cleanInventories(rawInventories);
    setInventories(inventories);

    // get, and set account kamis
    setKamis(getKamis());
  };

  useEffect(() => {
    setTimeout(() => {
      setVisible(!showSend);
    }, 300);
  }, [showSend]);
  /////////////////
  // INTERPRETATION

  const getItemActions = (item: Item, bal: number): Option[] => {
    if (item.for && item.for === 'KAMI') return getKamiOptions(item);
    else if (item.for && item.for === 'ACCOUNT') return getAccountOptions(item, bal);
    else return [];
  };

  const getKamiOptions = (item: Item): Option[] => {
    const available = kamis.filter((kami) => meetsRequirements(kami, item));
    return available.map((kami) => ({
      text: kami.name,
      onClick: () => actions.useForKami(kami, item),
    }));
  };

  const getAccountOptions = (item: Item, bal: number): Option[] => {
    if (!meetsRequirements(account, item)) return [];
    const useItem = (amt: number) => actions.useForAccount(item, amt);

    const options: ButtonListOption[] = [];
    const increments = [1, 3, 10, 33, 100, 333, 1000, 3333];
    increments.forEach((i) => {
      if (bal >= i) options.push({ text: `Use ${i}`, onClick: () => useItem(i) });
    });

    if (bal > 1) options.push({ text: 'Use All', onClick: () => useItem(bal) });

    return options;
  };

  const getSendHistory = useMemo(() => {
    const transfers: JSX.Element[] = [];

    sendHistory.forEach((send, index) => {
      const sender = getAccount(
        getEntityIndex(formatEntityID(BigNumber.from(send.SenderAccountID)))
      );
      const receiver = getAccount(
        getEntityIndex(formatEntityID(BigNumber.from(send.RecvAccountID)))
      );
      const item = getItem(send.ItemIndex as EntityIndex);
      if (receiver.id === account.id) {
        transfers.push(
          <div key={`receiver-${index}`}>
            * You <span style={{ color: 'green' }}>received</span> {send?.Amount} {item?.name} from{' '}
            {sender?.name}
          </div>
        );
      } else if (sender.id === account.id) {
        transfers.push(
          <div key={`sender-${index}`}>
            * You <span style={{ color: 'red' }}>sent</span> {send?.Amount} {item?.name} to{' '}
            {receiver?.name}
          </div>
        );
      }
    });
    return transfers.reverse();
  }, [sendHistory, account]);

  // // get the list of kamis that a specific item can be used on
  // const getAvailableKamis = (item: Item): Kami[] => {
  //   let kamis2 = getAccessibleKamis(account, kamis);
  //   if (item.type === 'REVIVE') kamis2 = kamis2.filter((kami) => kami.state === 'DEAD');
  //   if (item.type === 'FOOD') kamis2 = kamis2.filter((kami) => kami.state !== 'DEAD');
  //   if (item.type === 'RENAME_POTION') kamis2 = kamis2.filter((kami) => !kami.flags?.namable);
  //   if (item.type === 'SKILL_RESET') kamis2 = kamis2.filter((kami) => kami.state !== 'DEAD');
  //   return kamis2;
  // };

  /////////////////
  // DISPLAY

  const ItemIcon = (inv: Inventory) => {
    const item = inv.item;
    const options = getItemActions(item, inv.balance);

    return (
      <ItemWrapper key={item.index}>
        <TextTooltip
          key={item.index}
          text={item.index ? [<ItemGridTooltip key={item.index} item={item} utils={utils} />] : []}
          maxWidth={25}
        >
          <IconListButton
            key={item.index}
            img={item.image}
            scale={4.8}
            balance={inv.balance}
            options={options}
            disabled={options.length == 0}
          />
        </TextTooltip>
      </ItemWrapper>
    );
  };

  return (
    <>
      <Container isVisible={visible} key='grid'>
        {inventories.length < 1 && <EmptyText text={EMPTY_TEXT} />}
        {inventories.map((inv) => ItemIcon(inv))}
      </Container>
      <Send
        actions={{ sendItemsTx }}
        data={{ showSend, accounts, inventory: inventories }}
        utils={{ setShowSend, getInventoryBalance, getSendHistory }}
      />
    </>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex; ` : `display: none;`)}
  flex-flow: row wrap;
  justify-content: center;
  gap: 0.3vw;
`;

const ItemWrapper = styled.div`
  position: relative;
`;
