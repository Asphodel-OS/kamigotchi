import styled from 'styled-components';

import { AccountCard, ActionListButton, EmptyText } from 'app/components/library';
import { Friendship } from 'network/shapes/Friendship';

interface Props {
  isVisible: boolean;
  requests: Friendship[];
  actions: {
    cancelFren: (friendship: Friendship) => void;
  };
}

export const Outbound = (props: Props) => {
  const { requests, actions, isVisible } = props;

  const Actions = (friendship: Friendship) => {
    return (
      <ActionListButton
        id={`friendship-options-${friendship.entity}`}
        text=''
        options={[{ text: 'Cancel', onClick: () => actions.cancelFren(friendship) }]}
      />
    );
  };

  return (
    <Container isVisible={isVisible}>
      {requests.length === 0 ? (
        <EmptyText text={['no outbound requests']} size={0.9} />
      ) : (
        requests.map((friendship) => (
          <AccountCard
            key={friendship.target.index}
            account={friendship.target}
            description={['outbound friend request']}
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
