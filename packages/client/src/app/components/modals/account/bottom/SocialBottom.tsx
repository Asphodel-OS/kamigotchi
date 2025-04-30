import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Account, BaseAccount } from 'network/shapes/Account';
import { Friendship } from 'network/shapes/Friendship';
import { Kami } from 'network/shapes/Kami';
import { Blocked } from '../blocked/Blocked';
import { Friends } from '../friends/Friends';
import { Requests } from '../requests/Requests';

interface Props {
  subTab: string;
  data: {
    account: Account;
    getAllAccs: () => BaseAccount[];
  };
  actions: {
    acceptFren: (friendship: Friendship) => void;
    blockFren: (account: BaseAccount) => void;
    cancelFren: (friendship: Friendship) => void;
    requestFren: (account: BaseAccount) => void;
  };
  utils: {
    getAccountKamis: (accEntity: EntityIndex) => Kami[];
  };
}

export const SocialBottom = (props: Props) => {
  const { subTab, data, actions, utils } = props;
  const { account } = data;

  // NOTE: any child components that maintain their own state need to be inlined below, to
  // re-render and persist their state, rather than remounting
  return (
    <Container>
      {subTab === 'frens' && (
        <Friends
          key='friends'
          friendships={data.account.friends?.friends ?? []}
          actions={{
            blockFren: actions.blockFren,
            removeFren: actions.cancelFren,
          }}
        />
      )}
      {subTab === 'requests' && (
        <Requests
          key='requests'
          account={data.account}
          accounts={data.getAllAccs()}
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
        />
      )}
      {subTab === 'blocked' && (
        <Blocked
          key='blocked'
          blocked={data.account.friends?.blocked ?? []}
          actions={{
            cancelFren: actions.cancelFren,
          }}
        />
      )}
      {subTab === 'activity' && <EmptyText>not yet implemented</EmptyText>}
    </Container>
  );
};

const Container = styled.div`
  border: solid 0.15vw black;
  border-top: none;
  border-radius: 0 0 0.6vw 0.6vw;
  width: 100%;
  height: 100%;
  background-color: white;
  padding: 0.45vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;

  overflow-y: auto;
`;

const EmptyText = styled.div`
  color: black;
  margin: 1vw;

  font-size: 0.9vw;
  font-family: Pixel;
`;
