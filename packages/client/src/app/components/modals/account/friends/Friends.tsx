import { AccountCard, ActionListButton } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Friendship } from 'network/shapes/Friendship';
import styled from 'styled-components';

interface Props {
  friendships: Friendship[];
  actions: {
    blockFren: (account: Account) => void;
    removeFren: (friendship: Friendship) => void;
  };
}

export const Friends = (props: Props) => {
  const { friendships, actions } = props;

  const Actions = (friendship: Friendship) => {
    return (
      <ActionListButton
        id={`friendship-options-${friendship.entity}`}
        text=''
        options={[
          {
            text: 'Block',
            onClick: () => actions.blockFren(friendship.target),
          },
          { text: 'Remove', onClick: () => actions.removeFren(friendship) },
        ]}
      />
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
        <>
          <EmptyText>you have no friends</EmptyText>
          <EmptyText>go touch some grass</EmptyText>
        </>
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-flow: wrap;
  justify-content: center;
  align-items: flex-start;
`;

const EmptyText = styled.div`
  color: black;
  margin: 1vw;
  padding-top: 1vw;

  font-size: 1.2vw;
  font-family: Pixel;
`;
