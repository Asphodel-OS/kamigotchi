import styled from 'styled-components';

import { EntityIndex } from '@mud-classic/recs';
import { AccountCard, ActionListButton, EmptyText } from 'app/components/library';
import { Account as PlayerAccount } from 'app/stores';
import { Account } from 'network/shapes';
import { Friends as FriendsType } from 'network/shapes/Account/friends';
import { Friendship } from 'network/shapes/Friendship';

interface Props {
  data: { isSelf: boolean; player: PlayerAccount };
  actions: {
    acceptFren: (friendship: Friendship) => void;
    cancelFren: (friendship: Friendship) => void;
    blockFren: (account: Account) => void;
    requestFren: (account: Account) => void;
    removeFren: (friendship: Friendship) => void;
  };
  friendships: Friendship[];

  utils: {
    getFriends: (accEntity: EntityIndex) => FriendsType;
  };
}

export const Friends = (props: Props) => {
  const { friendships, actions, utils, data } = props;
  const { getFriends } = utils;
  const { player, isSelf } = data;

  const Actions = (friendship: Friendship) => {
    const playerGetFriends = getFriends(player.entity);

    const incomingEntities = playerGetFriends?.incomingReqs?.map((req) => req.account.entity);
    const isIncoming = incomingEntities?.includes(friendship.target.entity);

    const outgoingEntities = playerGetFriends?.outgoingReqs?.map((req) => req.target.entity);
    const isOutgoing = outgoingEntities?.includes(friendship.target.entity);

    const playerFriends = playerGetFriends?.friends?.map((fren) => fren.target.entity);
    const isFriend = playerFriends?.includes(friendship.target.entity);

    const isOther = player.entity !== friendship.target.entity;

    // if user is not already friend, is not the player, has not sent/recieved a friend request to/from the player we can add them
    const showAdd = !isFriend && isOther && !isIncoming && !isOutgoing;

    const options = [
      showAdd && { text: 'Add', onClick: () => actions.requestFren(friendship.target) },
      isOther && { text: 'Block', onClick: () => actions.blockFren(friendship.target) },
      isSelf && { text: 'Remove', onClick: () => actions.removeFren(friendship) },
    ].filter((o) => !!o);

    // Hide the action button if no actions are available.
    // This prevents showing the button on our own profile card when viewing on a friend's list.
    if (options.length === 0) return null;

    return (
      <ActionListButton id={`friendship-options-${friendship.entity}`} text='' options={options} />
    );
  };

  return (
    <Container>
      {friendships.length > 0 ? (
        friendships.map((friendship) => (
          <AccountCard
            key={friendship.entity}
            account={friendship.target}
            description={[friendship.target.bio || 'hi']}
            actions={Actions(friendship)}
          />
        ))
      ) : (
        <EmptyText text={['you have no friends', 'go touch some grass']} />
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  gap: 0.6vw;

  display: flex;
  flex-flow: wrap;
  justify-content: center;
  align-items: flex-start;
`;
