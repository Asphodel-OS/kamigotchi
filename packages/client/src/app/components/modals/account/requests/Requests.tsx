import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { ActionButton, TextTooltip } from 'app/components/library';
import { Pagination } from 'app/components/library/misc/Pagination';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Friendship } from 'network/shapes/Friendship';
import { Inbound } from './Inbound';
import { Outbound } from './Outbound';
import { Searched } from './Searched';

export const Requests = ({
  account,
  accounts,
  requests,
  actions,
}: {
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
}) => {
  const [mode, setMode] = useState('inbound');
  const [search, setSearch] = useState('');
  const [knownAccIndices, setKnownAccIndices] = useState([] as number[]);
  const [selectedLetter, setSelectedLetter] = useState('A');

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

  // i've memoized this 3 func to reduce the lag and control when they should update withou introducing more usestates
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => !knownAccIndices.includes(account.index));
  }, [accounts, knownAccIndices]);

  const filteredSearch = useMemo(() => {
    if (search.length < 2) return [];
    return filteredAccounts.filter(
      (account) => account.name.toLowerCase().includes(search.toLowerCase())
      // decided to comment this line because we are indexing by name and it feels confusing
      // || account.ownerAddress.toLowerCase().includes(search.toLowerCase())
    );
  }, [filteredAccounts, search]);

  const filteredByLetter = useMemo(() => {
    if (search.length >= 2) return filteredSearch;
    return filteredAccounts.filter((account) => {
      const firstChar = account.name?.[0]?.toUpperCase() ?? '';
      if (selectedLetter === '#') return !/^[A-Z]$/.test(firstChar);
      return firstChar === selectedLetter;
    });
  }, [search, selectedLetter, filteredAccounts, filteredSearch]);

  useEffect(() => {
    if (search.length >= 2) setMode('search');
  }, [search]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const ModeButton = ({
    mode: _mode,
    label,
  }: {
    mode: string;
    label: string;
  }) => {
    return (
      <TextTooltip text={[_mode]}>
        <ActionButton
          text={label}
          onClick={() => setMode(_mode)}
          disabled={mode === _mode}
        />
      </TextTooltip>
    );
  };

  return (
    <Container>
      <ActionRow>
        <ModeButtons>
          {ModeButton({ mode: 'inbound', label: '↙' })}
          {ModeButton({ mode: 'outbound', label: '↗' })}
          {ModeButton({ mode: 'search', label: '🔍' })}
        </ModeButtons>
        <Input
          key='search'
          type='text'
          placeholder='search'
          value={search}
          onChange={handleSearch}
        />
      </ActionRow>
      <Inbound
        isVisible={mode === 'inbound'}
        requests={requests.inbound}
        actions={{
          acceptFren: actions.acceptFren,
          blockFren: actions.blockFren,
          cancelFren: actions.cancelFren,
        }}
      />
      <Outbound
        isVisible={mode === 'outbound'}
        requests={requests.outbound}
        actions={{ cancelFren: actions.cancelFren }}
      />
      <>
        <Pagination
          isVisible={mode === 'search' && search.length < 2}
          selectedLetter={selectedLetter}
          onSelect={setSelectedLetter}
        />
        <Searched
          isVisible={mode === 'search'}
          accounts={filteredByLetter}
          actions={{
            blockFren: actions.blockFren,
            requestFren: actions.requestFren,
          }}
        />
      </>
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
  margin-bottom: 1em;
`;

const ModeButtons = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: 0.1em;
`;

const Input = styled.input`
  width: 50%;
  background-color: #ffffff;
  border: 0.15em solid black;
  border-radius: 0.5em;
  color: black;
  margin: 0.3em;
  padding: 0.6em;
  cursor: pointer;
  font-family: Pixel;
  font-size: 0.8em;
`;
