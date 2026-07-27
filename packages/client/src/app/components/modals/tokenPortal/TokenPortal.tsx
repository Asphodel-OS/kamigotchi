import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { getAccount as _getAccount, getAccountByID } from 'app/cache/account';
import { getPortalConfig } from 'app/cache/config';
import { getItem as _getItem, getItemByIndex as _getItemByIndex } from 'app/cache/item';
import { EmptyText, HelpChip, ModalWrapper } from 'app/components/library';
import { UIComponent, useLayers } from 'app/root';
import { useNetwork, useVisibility } from 'app/stores';
import { TokenIcons } from 'assets/images/tokens';
import { getKamidenClient } from 'clients/kamiden';
import { PortalReceipt, TokenPortalRequest } from 'clients/kamiden/proto';
import { ETH_INDEX, ONYX_INDEX } from 'constants/items';
import { EntityID, EntityIndex } from 'engine/recs';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Item, NullItem, queryItems } from 'network/shapes/Item';
import { getCompAddr } from 'network/shapes/utils';
import { playClick } from 'utils/sounds';
import { getHelpText } from './constants';
import { Queue } from './queue';
import { Swap } from './swap';
import { Mode } from './swap/types';
import { getResultWithdraw, openBaselineLink } from './utils';

// kamiswap (marketplace) tab pastels: blue for deposit, orange for withdraw
const DEPOSIT_BLUE = '#E0EEFF';
const WITHDRAW_ORANGE = '#FFF0E0';

const KamidenClient = getKamidenClient();

export const TokenPortalModal: UIComponent = {
  id: 'TokenPortal',
  Render: () => {
    const layers = useLayers();

    /////////////////
    // PREPARATION

    const { network, data, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);

      return {
        network,
        data: {
          accountEntity,
          config: getPortalConfig(world, components),
          spenderAddr: getCompAddr(world, components, 'component.token.allowance'),
        },
        utils: {
          getAccount: () => _getAccount(world, components, accountEntity, { inventory: 2 }),
          getAccountByID: (id: EntityID) => getAccountByID(world, components, id),
          getItem: (entity: EntityIndex) => _getItem(world, components, entity),
          getItemByIndex: (index: number) => _getItemByIndex(world, components, index),
          queryTokenItems: () => queryItems(components, { registry: true, type: 'ERC20' }),
        },
      };
    })();

    /////////////////
    // INSTANTIATIONS

    const { actions } = network;
    const { accountEntity, config, spenderAddr } = data;
    const { getAccount, getItem, queryTokenItems } = utils;

    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const isOpen = useVisibility((s) => s.modals.tokenPortal);

    const [account, setAccount] = useState<Account>(NullAccount);
    const [options, setOptions] = useState<Item[]>([]);
    const [selected, setSelected] = useState<Item>(NullItem); // selected item for import/export
    const [myReceipts, setMyReceipts] = useState<PortalReceipt[]>([]);
    const [othersReceipts, setOthersReceipts] = useState<PortalReceipt[]>([]);
    const [mode, setMode] = useState<Mode>('DEPOSIT');
    const [showQueue, setShowQueue] = useState<boolean>(false);
    const [tick, setTick] = useState(Date.now());

    /////////////////
    // SUBSCRIPTIONS

    // on mount, retrieve the list of ERC20 items and default to ONYX
    useEffect(() => {
      const itemEntites = queryTokenItems();
      const items = itemEntites.map((item) => getItem(item)) as Item[];
      const cleaned = items.filter((item) => item.index !== ETH_INDEX);
      setOptions(cleaned);

      // set up ticking
      const refreshClock = () => setTick(Date.now());
      const timerId = setInterval(refreshClock, 1000);
      return () => clearInterval(timerId);
    }, []);

    // default the selected option to ONYX whenever the list of item options change
    useEffect(() => {
      const onyxItem = options.find((item: Item) => item.index === ONYX_INDEX);
      if (onyxItem) setSelected(onyxItem);
      else console.warn('no onyx item found');
    }, [options.length]);

    // set the account if the connected entity changes
    useEffect(() => {
      if (!accountEntity) return;
      const account = getAccount();
      setAccount(account);
      getTokenHistory(account.id);
    }, [accountEntity]);

    // query for the list of Receipts
    // TODO: set up a caching for receipts
    useEffect(() => {
      if (!isOpen) return;
      const tickSeconds = Math.floor(tick / 1000);
      if (tickSeconds % 5 === 0) getTokenHistory(account.id);
    }, [isOpen, tick]);

    /////////////////
    // ACTIONS

    // approve the spend of an ERC20 token
    // amt is in human readable units (e.g. 1eth = 1)
    const approveTx = async (item: Item, amt: number) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      const actionID = uuid() as EntityID;
      actions.add({
        id: actionID,
        action: 'Approve token',
        params: [item.token?.address, spenderAddr, amt],
        description: `Approving ${amt} $ONYX to be spent`,
        execute: async () => {
          return api.erc20.approve(item.token?.address!, spenderAddr, amt);
        },
      });
    };

    // deposit ERC20 tokens into the game world
    const depositTx = async (item: Item, amt: number, convertAmt: number) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      const scale = item.token?.scale ?? 0;
      const tokenAmt = convertAmt / 10 ** scale;

      // construct the transaction and push it to the queue
      const tx = actions.add({
        action: 'TokenDeposit',
        params: [item.index, amt],
        description: `Depositing ${tokenAmt.toFixed(scale)} $ONYX for ${amt} ${item.name}`,
        execute: async () => api.portal.ERC20.deposit(item.index, convertAmt),
      });
    };

    // initiate a withdraw by creating a time-locked withdrawal receipt
    const withdrawTx = async (item: Item, amt: number) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      const taxedAmt = getResultWithdraw(config, amt);
      const scale = item.token?.scale ?? 0;
      const tokenAmt = taxedAmt / 10 ** scale;

      // construct the transaction and push it to the queue
      const tx = actions.add({
        action: 'TokenWithdraw',
        params: [item.index, amt],
        description: `Withdrawing ${amt} ${item.name} for ${tokenAmt.toFixed(scale)} $ONYX`,
        execute: async () => api.portal.ERC20.withdraw(item.index, amt),
      });
    };

    // claim a withdrawal receipt whose time has come
    const claimTx = async (receipt: PortalReceipt) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      // construct the transaction and push it to the queue
      const tx = actions.add({
        action: 'TokenReceiptClaim',
        params: [receipt.ReceiptID],
        description: `Claiming withdrawal of ${Number(receipt.TokenAmt) / 10 ** 18} $ONYX`,
        execute: async () => api.portal.ERC20.claim(receipt.ReceiptID),
      });
    };

    // cancel a withdrawal receipt
    const cancelTx = async (receipt: PortalReceipt) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);

      // construct the transaction and push it to the queue
      const tx = actions.add({
        action: 'TokenReceiptCancel',
        params: [receipt.ReceiptID],
        description: `Canceling withdrawal of ${Number(receipt.TokenAmt) / 10 ** 18} $ONYX`,
        execute: async () => api.portal.ERC20.cancel(receipt.ReceiptID),
      });
    };

    async function getTokenHistory(accountId: string) {
      const parsedAccountId = BigInt(accountId).toString();
      try {
        const request: TokenPortalRequest = {
          AccountID: parsedAccountId,
        };
        const requestOthers: TokenPortalRequest = {
          AccountID: '',
        };
        const myWidthdrawals = await KamidenClient?.getTokenWithdrawals(request);
        const myDeposits = await KamidenClient?.getTokenDeposits(request);
        setMyReceipts((myWidthdrawals?.Receipts ?? []).concat(myDeposits?.Receipts ?? []));
        const allWithdrawals = await KamidenClient?.getOpenWithdrawals(requestOthers);
        const allReceipts = allWithdrawals?.Receipts ?? [];
        const othersReceipts = allReceipts.filter(
          (receipt) => receipt.AccountID !== parsedAccountId
        );
        setOthersReceipts(othersReceipts);
      } catch (error) {
        console.error('Error getting token history :', error);
        throw error;
      }
    }

    /////////////////
    // DISPLAY

    const switchMode = (m: Mode) => {
      playClick();
      setMode(m);
    };

    const toggleQueue = () => {
      playClick();
      setShowQueue(!showQueue);
    };

    return (
      <ModalWrapper
        id='tokenPortal'
        header={
          <PortalHeader>
            <HeaderIcon src={TokenIcons.onyx} alt='Token Portal' />
            <HeaderTitle>Token Portal</HeaderTitle>
            <HelpChip tooltip={{ text: getHelpText(config), size: 0.6 }} size={1.2} />
          </PortalHeader>
        }
        canExit
        overlay
        truncate
        showScrollBar
      >
        {!accountEntity ? (
          <EmptyText text={['Failed to Connect Account']} size={1} />
        ) : (
          <Container>
            <Tabs>
              <TabButton
                $color={DEPOSIT_BLUE}
                $active={mode === 'DEPOSIT'}
                onClick={() => switchMode('DEPOSIT')}
                disabled={mode === 'DEPOSIT'}
              >
                Deposit
              </TabButton>
              <TabButton
                $color={WITHDRAW_ORANGE}
                $active={mode === 'WITHDRAW'}
                onClick={() => switchMode('WITHDRAW')}
                disabled={mode === 'WITHDRAW'}
                style={{ borderRight: 'none' }}
              >
                Withdraw
              </TabButton>
            </Tabs>
            <Swap
              actions={{
                approve: approveTx,
                deposit: depositTx,
                withdraw: withdrawTx,
              }}
              data={{ config, inventory: account.inventories ?? [] }}
              state={{ mode, selected }}
            />
            <BottomRow>
              <PillButton onClick={toggleQueue}>
                {showQueue ? 'Hide Queue' : 'Queue'}
              </PillButton>
              <PillButton onClick={() => openBaselineLink(selected.token?.address ?? '')}>
                Purchase $ONYX
              </PillButton>
            </BottomRow>
            {showQueue && (
              <Queue
                actions={{
                  claim: claimTx,
                  cancel: cancelTx,
                }}
                data={{ myReceipts, othersReceipts, config, account }}
                utils={utils}
              />
            )}
          </Container>
        )}
      </ModalWrapper>
    );
  },
};

/////////////////
// STYLES

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1vh;
`;

const PortalHeader = styled.div`
  padding: 0.6vw 1vw;
  gap: 0.7vw;
  line-height: 1.5vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
  user-select: none;
`;

const HeaderIcon = styled.img`
  height: 2vw;
  width: auto;
  user-drag: none;
`;

const HeaderTitle = styled.div`
  font-size: 1.2vw;
  color: #333;
  font-family: Pixel;
`;

const Tabs = styled.div`
  border: solid 0.15vw black;
  border-radius: 0.3vw 0.3vw 0 0;
  width: 100%;
  background-color: white;
  display: flex;
  flex-flow: row nowrap;
`;

const TabButton = styled.button<{ $color: string; $active: boolean }>`
  border: none;
  border-right: solid black 0.15vw;
  padding: 0.5vw;
  flex: 1 1 0;
  color: black;
  font-family: Pixel;
  font-size: 0.9vw;
  text-align: center;
  cursor: pointer;
  background-color: ${({ $active, $color }) => ($active ? $color : 'white')};
  &:hover {
    background-color: ${({ $color }) => $color}88;
  }
  &:disabled {
    cursor: default;
    pointer-events: none;
  }
`;

const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6vw;
`;

const PillButton = styled.button`
  border: 0.12vw solid #ccc;
  border-radius: 0.5vw;
  background: #fafafa;
  color: #555;
  padding: 0.4vw 0.9vw;
  font-family: Pixel;
  font-size: 0.75vw;
  cursor: pointer;
  pointer-events: auto;
  transition:
    background 0.12s,
    border-color 0.12s;
  &:hover {
    background: #e8f0fe;
    border-color: #a0c0e8;
  }
`;
