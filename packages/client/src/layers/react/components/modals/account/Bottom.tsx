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

  // this is extremely retarded, but we must pass any state down from the parent
  mode: {
    mode: string;
    setMode: (mode: string) => void;
  }
  search: {
    search: string;
    setSearch: (search: string) => void;
  }
}

export const Bottom = (props: Props) => {
  const { tab, data, actions } = props;

  const RenderedTab = () => {
    if (tab === 'party') return <Kamis kamis={data.account.kamis ?? []} />
    if (tab === 'frens') return (
      <Friends
        friendships={data.account.friends?.friends ?? []}
        actions={{
          blockFren: actions.blockFren,
          removeFren: actions.cancelFren,
        }}
      />
    );
    if (tab === 'requests') return (
      <Requests
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
        mode={props.mode}
        search={props.search}
      />
    );
    else return <EmptyText>Not yet implemented</EmptyText>
  }

  return (
    <Container>
      <RenderedTab />
    </Container>
  );
}

const Container = styled.div`
  border: solid .15vw black;
  border-radius: 0 0 .3vw .3vw;
  width: 100%;
  height: 100%;
  background-color: white;
  padding: 1vw;

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