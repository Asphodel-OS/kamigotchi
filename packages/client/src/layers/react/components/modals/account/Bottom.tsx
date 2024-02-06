import React from "react";
import styled from "styled-components";

import { Friends } from "./friends/Friends";
import { Kamis } from "./party/Kamis";
import { Requests } from "./requests/Requests";
import { Account } from "layers/network/shapes/Account";
import { Friendship } from "layers/network/shapes/Friendship";


interface Props {
  tab: string;
  data: {
    account: Account;
    accounts: Account[];
  }
  actions: {
    acceptFren: (friendship: Friendship) => void;
    blockFren: (account: Account) => void;
    cancelFren: (friendship: Friendship) => void;
    requestFren: (account: Account) => void;
  }
}

export const Bottom = (props: Props) => {
  const { tab, data, actions } = props;

  // NOTE: any child components that maintain their own state need to be inlined below, to 
  // re-render and persist their state, rather than remounting
  return (
    <Container>
      {(tab === 'party') && <Kamis kamis={data.account.kamis ?? []} />}
      {(tab === 'frens') && <Friends
        key='friends'
        friendships={data.account.friends?.friends ?? []}
        actions={{
          blockFren: actions.blockFren,
          removeFren: actions.cancelFren,
        }}
      />}
      {(tab === 'requests') && <Requests
        key='requests'
        account={data.account}
        accounts={data.accounts}
        requests={{
          inbound: data.account.friends?.incomingReqs ?? [],
          outbound: data.account.friends?.outgoingReqs ?? [],
        }}
        actions={{
          acceptFren: actions.acceptFren,
          blockFren: actions.blockFren,
          cancelFren: actions.cancelFren,
          requestFren: actions.requestFren,
        }}
      />}
      {(tab === 'blocked') && <EmptyText>not yet implemented</EmptyText>}
      {(tab === 'activity') && <EmptyText>not yet implemented</EmptyText>}
    </Container>
  );
}

const Container = styled.div`
  border: solid .15vw black;
  border-radius: 0 0 .3vw .3vw;
  width: 100%;
  height: 100%;
  background-color: white;
  padding: .3vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;
  
  overflow-y: scroll;
`;

const EmptyText = styled.div`
  color: black;
  margin: 1vw;

  font-size: .9vw;
  font-family: Pixel;
`;