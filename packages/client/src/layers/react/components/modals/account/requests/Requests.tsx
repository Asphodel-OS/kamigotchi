import { Account } from "layers/network/shapes/Account";
import { Friendship } from "layers/network/shapes/Friendship";
import { ActionButton, ActionListButton, Tooltip } from "layers/react/components/library";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { Inbound } from "./Inbound";
import { Outbound } from "./Outbound";


interface Props {
  accounts: Account[];
  requests: {
    inbound: Friendship[];
    outbound: Friendship[];
  }
  actions: {
    acceptFren: (friendship: Friendship) => void;
    blockFren: (account: Account) => void;
    cancelFren: (friendship: Friendship) => void;
    requestFren: (account: Account) => void;
  }
  mode: {
    mode: string;
    setMode: (mode: string) => void;
  }
  search: {
    search: string;
    setSearch: (search: string) => void;
  }
}

export const Requests = (props: Props) => {
  const { requests, actions } = props;
  const { mode, setMode } = props.mode;

  const Interactions = () => {
    return (
      <ActionRow>
        <Tooltip text={['inbound']} >
          <ActionButton
            id='inbound'
            text='↙'
            onClick={() => setMode('inbound')}
            disabled={mode === 'inbound'}
          />
        </Tooltip>
        <Tooltip text={['outbound']} >
          <ActionButton
            id='outbound'
            text='↗'
            onClick={() => setMode('outbound')}
            disabled={mode === 'outbound'}
          />
        </Tooltip>
      </ActionRow>
    );
  }

  const List = () => {
    if (mode === 'inbound') return (
      <Inbound
        requests={requests.inbound}
        actions={{
          acceptFren: actions.acceptFren,
          blockFren: actions.blockFren,
          cancelFren: actions.cancelFren,
        }}
      />
    );
    if (mode === 'outbound') return (
      <Outbound
        requests={requests.outbound}
        actions={{ cancelFren: actions.cancelFren }}
      />
    );
    else return <EmptyText>no pending requests</EmptyText>;
  }

  return (
    <Container>
      <Interactions />
      <List />
    </Container>
  );
}


const Container = styled.div`
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
`;

const ActionRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;

  margin-bottom: 1vw;
`;

const EmptyText = styled.div`
  color: black;
  margin: 1vw;

  font-size: .9vw;
  font-family: Pixel;
`;