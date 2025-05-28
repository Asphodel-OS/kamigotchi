import styled from 'styled-components';

import { AccountCard, ActionListButton, EmptyText } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Friendship } from 'network/shapes/Friendship';

interface Props {
  actions: {
    blockFren: (account: Account) => void;
    removeFren: (friendship: Friendship) => void;
  };
  friendships: Friendship[];
  isSelf: boolean;
}

export const Friends = (props: Props) => {
  const { friendships, actions, isSelf } = props;

  const Actions = (friendship: Friendship) => {
    const options = [
      {
        text: 'Block',
        onClick: () => actions.blockFren(friendship.target),
      },
    ];
    if (isSelf) {
      options.push({
        text: 'Remove',
        onClick: () => actions.removeFren(friendship),
      });
    }
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
            description={['hi']}
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
