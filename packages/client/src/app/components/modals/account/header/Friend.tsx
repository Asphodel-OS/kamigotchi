import styled from 'styled-components';
import { EntityIndex } from '@mud-classic/recs';

import { Account as PlayerAccount } from 'app/stores';
import { ActionButton } from 'app/components/library/buttons/ActionButton';
import { ActionListButton } from 'app/components/library/buttons/ActionListButton';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Friends as FriendsType } from 'network/shapes/Account/friends';
import { Friendship } from 'network/shapes/Friendship';

interface Props {
  account: Account;
  player: PlayerAccount;
  utils: {
    getFriends: (accEntity: EntityIndex) => FriendsType;
  };
  actions: {
    requestFren: (account: BaseAccount) => void;
    acceptFren: (friendship: Friendship) => void;
    cancelFren: (friendship: Friendship) => void;
    blockFren: (account: BaseAccount) => void;
  };
}

export const Friend = (props: Props) => {
  const { account, player, utils, actions } = props;
  const { getFriends } = utils;
  const { requestFren, acceptFren, cancelFren, blockFren } = actions;

  const friends = getFriends(player.entity);

  const incoming = friends?.incomingReqs?.find(r => r.account.entity === account.entity) ?? null;
  const outgoing = friends?.outgoingReqs?.find(r => r.target.entity === account.entity) ?? null;
  const friendship = friends?.friends?.find(f => f.target.entity === account.entity) ?? null;
  const blocked = friends?.blocked?.find(b => b.target.entity === account.entity) ?? null;

  const isIncoming = !!incoming;
  const isOutgoing = !!outgoing;
  const isFriend = !!friendship;
  const isBlockedByPlayer = !!blocked;
  const isBlockedByOther =
    account.friends?.blocked?.some(b => b.target.entity === player.entity) ?? false;

  return (
    <Container>
      {isBlockedByPlayer ? (
        <>
          <ActionListLabel $variant="blocked">Blocked</ActionListLabel>
          <ActionButton size="small" text="Unblock" onClick={() => blocked && cancelFren(blocked)} />
        </>
      ) : isBlockedByOther ? (
        <ActionListLabel $variant="blocked">Blocked You</ActionListLabel>
      ) : !isFriend && !isIncoming && !isOutgoing ? (
        <>
          <ActionButton size='small' text='Add Friend' onClick={() => requestFren(account)} />
          <ActionButton size='small' text='Block' onClick={() => blockFren(account)} />
        </>
      ) : isIncoming ? (
        <>
          <ActionListLabel $variant="pending">Requested You</ActionListLabel>
          <ActionListButton
            id={`friend-actions-inbound-${account.entity}`}
            text=''
            size='small'
            options={[
              {
                text: 'Accept',
                onClick: () => incoming && acceptFren(incoming),
                disabled: !isIncoming,
              },
              { text: 'Block', onClick: () => blockFren(account) },
              {
                text: 'Decline',
                onClick: () => incoming && cancelFren(incoming),
                disabled: !isIncoming,
              },
            ]}
          />
        </>
      ) : isOutgoing ? (
        <>
          <ActionListLabel $variant="pending">Request Sent</ActionListLabel>
          <ActionListButton
            id={`friend-actions-outbound-${account.entity}`}
            text=''
            size='small'
            options={[
              {
                text: 'Cancel',
                onClick: () => outgoing && cancelFren(outgoing),
                disabled: !isOutgoing,
              },
              { text: 'Block', onClick: () => blockFren(account) },
            ]}
          />
        </>
      ) : (
        <>
          <ActionListLabel $variant="friends">Friends</ActionListLabel>
          <ActionListButton
            id={`friend-actions-friends-${account.entity}`}
            text=""
            size="small"
            options={[
              { text: 'Remove', onClick: () => friendship && cancelFren(friendship) },
              { text: 'Block', onClick: () => blockFren(account) },
            ]}
          />
        </>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  gap: 0.45vw;
`;

const COLORS = {
  friends: {
    text: '#3A6B35',
    border: '#A3D8A0',
    background: '#E9F5E8',
  },
  pending: {
    text: '#8B6B00',
    border: '#F7D65A',
    background: '#FFFBEA',
  },
  blocked: {
    text: '#8B0000',
    border: '#F75A5A',
    background: '#FFEAEC',
  },
};

const ActionListLabel = styled.div<{ $variant: 'friends' | 'pending' | 'blocked' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .6vw;
  padding: .3vw .6vw;
  border-radius: .3vw;
  border: .15vw solid ${({ $variant }) => COLORS[$variant].border};
  color: ${({ $variant }) => COLORS[$variant].text};
  background-color: ${({ $variant }) => COLORS[$variant].background};
  box-shadow: 0 0.1vw 0.2vw rgba(0, 0, 0, 0.1);
`;