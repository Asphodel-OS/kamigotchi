import { useEffect, useState } from "react";
import styled from "styled-components";

import { Inbound } from "./Inbound";
import { Outbound } from "./Outbound";
import { Account } from "layers/network/shapes/Account";
import { Friendship } from "layers/network/shapes/Friendship";
import { ActionButton, Tooltip } from "layers/react/components/library";
import { Searched } from "./Searched";


interface Props {
  account: Account;
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
}

export const Requests = (props: Props) => {
  const { account, requests, actions } = props;
  const [mode, setMode] = useState('inbound');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([] as Account[]);
  const [knownAccIndices, setKnownAccIndices] = useState([] as number[]);

  // keep track of which accounts are already in requests
  useEffect(() => {
    const inboundIndices = requests.inbound.map((req) => req.account.index);
    const outboundIndices = requests.outbound.map((req) => req.target.index);
    setKnownAccIndices([...inboundIndices, ...outboundIndices, account.index]);
  }, [requests.inbound, requests.outbound, account]);

  // update search results according to updated search string
  useEffect(() => {
    if (search !== '') setMode('search');
    setSearchResults(filterAccounts(search));
  }, [search]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearch(value);
  };


  // filters the list of accounts by whether their name/ownerEOA contains a substring
  const filterAccounts = (value: string) => {
    const accounts = props.accounts.filter(
      (account) => !knownAccIndices.includes(account.index)
    );

    if (value.length < 2) return accounts;

    return accounts.filter(
      (account) => (
        account.name.toLowerCase().includes(value.toLowerCase())
        || account.ownerEOA.toLowerCase().includes(value.toLowerCase())
      )
    );
  }

  //////////////////
  // DISPLAY

  // list of account cards to display
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
    if (mode === 'search') return (
      <Searched
        accounts={searchResults}
        actions={{
          blockFren: actions.blockFren,
          requestFren: actions.requestFren,
        }}
      />
    );
    return <EmptyText>no pending requests</EmptyText>;
  }

  return (
    <Container>
      <ActionRow>
        <ModeButtons>
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
          <Tooltip text={['search']} >
            <ActionButton
              id='search'
              text='🔍'
              onClick={() => setMode('search')}
              disabled={mode === 'search'}
            />
          </Tooltip>
        </ModeButtons>
        <Input
          key='search'
          type='text'
          placeholder={'search'}
          value={search}
          onChange={(e) => handleSearch(e)}
        />
      </ActionRow>
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

const ModeButtons = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: .1vw;
`;

const ActionRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 1vw;
`;

const Input = styled.input`
  width: 100%;
  background-color: #ffffff;
  border-color: black;
  border-radius: .5vw;
  border-style: solid;
  border-width: .15vw;
  color: black;
  width: 50%;
  margin: .3vw;
  
  padding: .6vw;
  cursor: pointer;
  font-family: Pixel;
  font-size: .8vw;
  text-align: left;
  text-decoration: none;
  justify-content: center;
  align-items: center;
`;

const EmptyText = styled.div`
  color: black;
  margin: 1vw;

  font-size: .9vw;
  font-family: Pixel;
`;