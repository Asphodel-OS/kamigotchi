import styled from 'styled-components';

import { Account } from 'layers/network/shapes/Account';
import { Friendship } from 'layers/network/shapes/Friendship';
import { ActionListButton } from 'layers/react/components/library';
import { AccountCard } from 'layers/react/components/library/AccountCard';

interface Props {
  requests: Friendship[];
  actions: {
    cancelFren: (friendship: Friendship) => void;
  };
}

export const Outbound = (props: Props) => {
  const { requests, actions } = props;

  const Actions = (friendship: Friendship) => {
    return (
      <ActionListButton
        id={`friendship-options-${friendship.entityIndex}`}
        text=''
        options={[
          { text: 'Cancel', onClick: () => actions.cancelFren(friendship) },
        ]}
      />
    );
  };

  if (requests.length === 0) return <EmptyText>no outbound requests</EmptyText>;
  return (
    <Container>
      {requests.map((friendship) => (
        <AccountCard
          key={friendship.target.index}
          account={friendship.target}
          description={['outbound friend request']}
          actions={Actions(friendship)}
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
