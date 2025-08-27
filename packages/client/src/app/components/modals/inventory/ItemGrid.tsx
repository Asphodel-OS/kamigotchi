import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { cleanInventories, Inventory } from 'app/cache/inventory';
import { EmptyText, IconListButton, TextTooltip } from 'app/components/library';
import { ButtonListOption } from 'app/components/library/buttons';
import { Option } from 'app/components/library/buttons/IconListButton';
import { useVisibility } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { Account, NullAccount } from 'network/shapes/Account';
import { Allo } from 'network/shapes/Allo';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { DetailedEntity } from 'network/shapes/utils';
import { ItemGridTooltip } from './ItemGridTooltip';
import { Send } from './Send';

const EMPTY_TEXT = ['Inventory is empty.', 'Be less poore..'];
const REFRESH_INTERVAL = 2000;
const SendButtons = new Map<number, React.ReactNode>();

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
  data: { showSend: boolean };
  utils: {
    meetsRequirements: (holder: Kami | Account, item: Item) => boolean;
    getAccount: () => Account;
    getInventories: () => Inventory[];
    getKamis: () => Kami[];
    displayRequirements: (item: Item) => string;
    parseAllos: (allo: Allo[]) => DetailedEntity[];
    setShowSend: (show: boolean) => void;
  };
}) => {
  const { getAccount, getInventories, getKamis, meetsRequirements } = utils;
  const { showSend } = data;
  const { sendItemsTx } = actions;

  const { modals } = useVisibility();
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [account, setAccount] = useState<Account>(NullAccount);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [kamis, setKamis] = useState<Kami[]>([]);

  useEffect(() => {
    inventories.forEach((inventory) => {
      if (!SendButtons.has(inventory.item.index)) {
        // console.log(`adding send button for ${kami.name}`);
        SendButtons.set(inventory.item.index, SendButton([inventory.item], [inventory.balance]));
      }
    });
  }, [inventories.length]);

  // refresh data whenever the modal is opened
  useEffect(() => {
    if (!modals.inventory) return;
    updateData();
  }, [modals.inventory, lastRefresh, accountEntity]);

  // update the inventory, account and kami data
  const updateData = () => {
    const account = getAccount();
    setAccount(account);

    // get, clean, and set account inventories
    const rawInventories = getInventories() ?? [];
    const inventories = cleanInventories(rawInventories);
    setInventories(inventories);

    // get, and set account kamis
    setKamis(getKamis());
  };

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

  const getSendTooltip = (item: Item) => {
    const tooltip = [`Send ${item.name} to another account.`];
    return tooltip;
  };

  const SendButton = (item: Item[], amts: number[]) => {
    const options = accounts.map((targetAcc) => ({
      text: `${targetAcc.name} (#${targetAcc.index})`,
      onClick: () => sendItemsTx(item, amts, targetAcc),
    }));

    return (
      <TextTooltip key='send-tooltip' text={getSendTooltip(item[0])}>
        <IconListButton img={ArrowIcons.right} options={options} searchable scale={1.5} />
      </TextTooltip>
    );
  };

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
  // <SendButtonStyled>{SendButtons.get(item.index)}</SendButtonStyled>
  const ItemIcon = (inv: Inventory) => {
    const item = inv.item;
    const options = getItemActions(item, inv.balance);
    const sendButton = SendButton([item], [inv.balance]);

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
      <Container isVisible={!showSend} key='grid'>
        {inventories.length < 1 && <EmptyText text={EMPTY_TEXT} />}
        {inventories.map((inv) => ItemIcon(inv))}
      </Container>
      <Send
        actions={{ sendItemsTx }}
        data={{ showSend, accounts, inventories }}
        utils={{ setShowSend }}
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
