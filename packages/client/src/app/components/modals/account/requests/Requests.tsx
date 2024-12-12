import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ActionButton, Tooltip } from 'app/components/library';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Friendship } from 'network/shapes/Friendship';
import { Inbound } from './Inbound';
import { Outbound } from './Outbound';
import { Searched } from './Searched';

interface Props {
  account: Account;
  accounts: BaseAccount[];
  requests: {
    inbound: Friendship[];
    outbound: Friendship[];
  };
  actions: {
    acceptFren: (friendship: Friendship) => void;
    blockFren: (account: BaseAccount) => void;
    cancelFren: (friendship: Friendship) => void;
    requestFren: (account: BaseAccount) => void;
  };
}

export const Requests = (props: Props) => {
  const { account, requests, actions } = props;
  const [mode, setMode] = useState('inbound');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([] as BaseAccount[]);
  const [knownAccIndices, setKnownAccIndices] = useState([] as number[]);

  // keep track of which accounts are already friends, requested or blocked
  useEffect(() => {
    const inboundIndices = requests.inbound.map((req) => req.account.index);
    const outboundIndices = requests.outbound.map((req) => req.target.index);
    const friendIndices = account.friends?.friends.map((fren) => fren.target.index) ?? [];
    const blockedIndices = account.friends?.blocked.map((fren) => fren.target.index) ?? [];
    setKnownAccIndices([
      account.index,
      ...blockedIndices,
      ...friendIndices,
      ...inboundIndices,
      ...outboundIndices,
    ]);
  }, [requests.inbound, requests.outbound, account]);

  // update search results according to updated search string
  useEffect(() => {
    if (search !== '') setMode('search');
    setSearchResults(filterAccounts(search));
  }, [search, knownAccIndices]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearch(value);
  };

  //////////////////
  // INTERPRETATION

  // TODO:  implement a lazy query or something less compute heavy
  // filters the list of accounts by whether their name/ownerAddress contains a substring
  const filterAccounts = (value: string) => {
    const accounts = props.accounts.filter((account) => !knownAccIndices.includes(account.index));

    if (value.length < 2) accounts;

    return accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(value.toLowerCase()) ||
        account.ownerAddress.toLowerCase().includes(value.toLowerCase())
    );
  };

  //////////////////
  // DISPLAY

  const ModeButton = (props: { mode: string; label: string }) => {
    return (
      <Tooltip text={[props.mode]}>
        <ActionButton
          text={props.label}
          onClick={() => setMode(props.mode)}
          disabled={mode === props.mode}
        />
      </Tooltip>
    );
  };

  //////////////////
  // RENDER

  return (
    <Container>
      <ActionRow>
        <ModeButtons>
          <ModeButton mode='inbound' label='↙' />
          <ModeButton mode='outbound' label='↗' />
          <ModeButton mode='search' label='🔍' />
        </ModeButtons>
        <Input
          key='search'
          type='text'
          placeholder={'search'}
          value={search}
          onChange={(e) => handleSearch(e)}
        />
      </ActionRow>

      {mode === 'inbound' && (
        <Inbound
          requests={requests.inbound}
          actions={{
            acceptFren: actions.acceptFren,
            blockFren: actions.blockFren,
            cancelFren: actions.cancelFren,
          }}
        />
      )}
      {mode === 'outbound' && (
        <Outbound requests={requests.outbound} actions={{ cancelFren: actions.cancelFren }} />
      )}
      {mode === 'search' && (
        <Searched
          accounts={searchResults}
          actions={{
            blockFren: actions.blockFren,
            requestFren: actions.requestFren,
          }}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
`;

const ActionRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 1vw;
`;

const ModeButtons = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: 0.1vw;
`;

const Input = styled.input`
  width: 100%;
  background-color: #ffffff;
  border-color: black;
  border-radius: 0.5vw;
  border-style: solid;
  border-width: 0.15vw;
  color: black;
  width: 50%;
  margin: 0.3vw;

  padding: 0.6vw;
  cursor: pointer;
  font-family: Pixel;
  font-size: 0.8vw;
  text-align: left;
  text-decoration: none;
  justify-content: center;
  align-items: center;
`;
