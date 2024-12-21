import styled from 'styled-components';

import { AccountCard, ActionListButton } from 'app/components/library';
import { Friendship } from 'network/shapes/Friendship';

interface Props {
  blocked: Friendship[];
  actions: {
    cancelFren: (friendship: Friendship) => void;
  };
}

export const Blocked = (props: Props) => {
  const { blocked, actions } = props;
  if (blocked.length === 0) return <EmptyText>no blocked accounts</EmptyText>;

  return (
    <Container>
      {blocked.map((friendship) => (
        <AccountCard
          key={friendship.target.index}
          account={friendship.target}
          description={['hate crime enthusiast']}
          actions={
            <ActionListButton
              id={`friendship-options-${friendship.entity}`}
              text=''
              options={[
                {
                  text: 'Unblock',
                  onClick: () => actions.cancelFren(friendship),
                },
              ]}
            />
          }
        />
      ))}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

const EmptyText = styled.div`
  color: black;
  margin: 1vw;

  display: flex;
  justify-content: center;
  align-items: center;

  font-size: 0.9vw;
  font-family: Pixel;
`;
