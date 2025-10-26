import { EntityID, EntityIndex } from 'engine/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, Text, TextTooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { ItemTransfer } from 'clients/kamiden/proto';
import { formatEntityID } from 'engine/utils';
import { Account, Item } from 'network/shapes';
import { Mode } from '../types';

export const History = ({
  data,
  state,
  utils,
}: {
  data: {
    account: Account;
    events: ItemTransfer[];
  };
  state: {
    mode: Mode;
  };
  utils: {
    getAccount: (entity: EntityIndex) => Account;
    getEntityIndex: (entity: EntityID) => EntityIndex;
    getItem: (entity: EntityIndex) => Item;
  };
}) => {
  const { account, events } = data;
  const { mode } = state;
  const { getAccount, getEntityIndex, getItem } = utils;

  const isInventoryOpen = useVisibility((s) => s.modals.inventory);
  const [displayed, setDisplayed] = useState<ItemTransfer[]>([]);

  // trigger raw->displayed event filtering whenever relevant state changes
  useEffect(() => {
    if (!isInventoryOpen || mode !== 'TRANSFER') return;
    const filtered = filterEvents(events);
    setDisplayed(filtered);
  }, [events, isInventoryOpen, mode, account.id]);

  /////////////////
  // INTERPRETATION

  // filter the list of events to just those relevant to the account
  const filterEvents = (events: ItemTransfer[]) => {
    const filtered = events.filter((event) => {
      const senderID = formatEntityID(event.SenderAccountID);
      const receiverID = formatEntityID(event.RecvAccountID);
      const senderMatches = senderID === account.id;
      const receiverMatches = receiverID === account.id;
      return senderMatches || receiverMatches;
    });
    return filtered;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <TitleBar>
        <Text size={0.9}>Your Transfer History</Text>
        <Text size={0.75}>Fee: 15 MUSU</Text>
      </TitleBar>
      <List>
        {displayed.map((send, index) => {
          const senderID = formatEntityID(send.SenderAccountID);
          const receiverID = formatEntityID(send.RecvAccountID);
          const sender = getAccount(getEntityIndex(senderID));
          const receiver = getAccount(getEntityIndex(receiverID));
          const item = getItem(send.ItemIndex as EntityIndex);

          const isSender = sender.id === account.id;
          return isSender ? (
            <Row key={`sender-${index}`}>
              * You <span style={{ color: 'red' }}>sent</span>
              {send?.Amount}
              <TextTooltip text={[item?.name]}>
                <Icon src={item?.image} />
              </TextTooltip>
              to {receiver?.name}
            </Row>
          ) : (
            <Row key={`receiver-${index}`}>
              * You <span style={{ color: 'green' }}>received</span>
              {send?.Amount}
              <TextTooltip text={[item?.name]}>
                <Icon src={item?.image} />
              </TextTooltip>
              from {sender?.name}
            </Row>
          );
        })}
      </List>
      {displayed.length === 0 && <EmptyText text={['No transfers to show.']} size={1} />}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-top: 0.15vw solid black;
  width: 100%;
  height: 100%;
  gap: 0.3vw;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;

  overflow-y: auto;
`;

const TitleBar = styled.div`
  background-color: rgb(221, 221, 221);
  position: sticky;
  top: 0;
  width: 100%;
  height: 3vw;

  margin-bottom: 0.3vw;
  padding: 0.9vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;

  opacity: 0.9;
`;

const List = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;

  overflow-y: scroll;
`;

const Row = styled.div`
  width: 96%;
  height: 1.2vw;
  gap: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;

  font-size: 0.6vw;
`;

const Icon = styled.img`
  position: relative;
  width: 0.9vw;
  height: 0.9vw;
`;
