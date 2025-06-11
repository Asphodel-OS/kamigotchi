import styled from 'styled-components';

import { AccountCard, ActionListButton, EmptyText } from 'app/components/library';
import { BaseAccount } from 'network/shapes/Account';
import { Friendship } from 'network/shapes/Friendship';

interface Props {
  isVisible: boolean;
  requests: Friendship[];
  actions: {
    acceptFren: (friendship: Friendship) => void;
    blockFren: (account: BaseAccount) => void;
    cancelFren: (friendship: Friendship) => void;
  };
}

export const Inbound = (props: Props) => {
  const { requests, actions, isVisible } = props;

  const Actions = (friendship: Friendship) => {
    return (
      <ActionListButton
        id={`friendship-options-${friendship.entity}`}
        text=''
        options={[
          { text: 'Accept', onClick: () => actions.acceptFren(friendship) },
          {
            text: 'Block',
            onClick: () => actions.blockFren(friendship.account),
          },
          { text: 'Decline', onClick: () => actions.cancelFren(friendship) },
        ]}
      />
    );
  };

  return (
    <Container isVisible={isVisible}>
      {requests.length === 0 ? (
        <EmptyText text={['no inbound requests']} size={0.9} />
      ) : (
        requests.map((friendship) => (
          <AccountCard
            key={friendship.account.index}
            account={friendship.account}
            description={[friendship.account.bio ?? 'inbound friend request']}
            actions={Actions(friendship)}
          />
        ))
      )}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  width: 100%;
  gap: 0.6vw;
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;
