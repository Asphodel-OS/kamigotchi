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
  onToggleCollapse,
}: {
  data: {
    account: Account;
    events: ItemTransfer[];
  };
  state: {
    mode: Mode;
    isCollapsed: boolean;
  };
  utils: {
    getAccount: (entity: EntityIndex) => Account;
    getEntityIndex: (entity: EntityID) => EntityIndex;
    getItem: (entity: EntityIndex) => Item;
  };
  onToggleCollapse: () => void;
}) => {
  const { account, events } = data;
  const { mode, isCollapsed } = state;
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
      <TitleBar onClick={onToggleCollapse}>
        <TitleLeft>
          <CollapseIcon $isCollapsed={isCollapsed}>▼</CollapseIcon>
          <Text size={0.9}>Transfer History</Text>
        </TitleLeft>
        <Text size={0.75}>Fee: 15 MUSU per item type</Text>
      </TitleBar>

      <ContentWrapper $isCollapsed={isCollapsed}>
        {displayed.length === 0 ? (
          <EmptyText text={['No transfers to show.']} size={0.8} />
        ) : (
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
        )}
      </ContentWrapper>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-top: 0.15vw solid black;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
`;

const TitleBar = styled.div`
  background-color: rgb(221, 221, 221);
  width: 100%;
  min-height: 2.5vw;
  padding: 0.6vw 0.9vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;

  &:hover {
    background-color: rgb(200, 200, 200);
  }
`;

const TitleLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5vw;
`;

const CollapseIcon = styled.span<{ $isCollapsed: boolean }>`
  font-size: 0.7vw;
  color: #555;
  transition: transform 0.2s;
  transform: rotate(${({ $isCollapsed }) => ($isCollapsed ? '-90deg' : '0deg')});
`;

const ContentWrapper = styled.div<{ $isCollapsed: boolean }>`
  display: ${({ $isCollapsed }) => ($isCollapsed ? 'none' : 'flex')};
  flex-direction: column;
  max-height: 15vh;
  overflow-y: auto;

  ::-webkit-scrollbar {
    background: transparent;
    width: 0.5vw;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 0.25vw;
  }
`;

const List = styled.div`
  position: relative;
  width: 100%;
  padding: 0.5vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 0.2vw;
`;

const Row = styled.div`
  width: 96%;
  min-height: 1.4vw;
  gap: 0.3vw;
  padding: 0.2vw 0;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
  font-size: 0.65vw;
`;

const Icon = styled.img`
  position: relative;
  width: 1vw;
  height: 1vw;
`;
