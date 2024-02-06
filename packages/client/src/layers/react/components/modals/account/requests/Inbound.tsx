import styled from "styled-components";

import { Account } from "layers/network/shapes/Account";
import { Friendship } from "layers/network/shapes/Friendship";
import { ActionListButton } from "layers/react/components/library";
import { AccountCard } from "layers/react/components/library/AccountCard";


interface Props {
  requests: Friendship[];
  actions: {
    acceptFren: (friendship: Friendship) => void;
    blockFren: (account: Account) => void;
    cancelFren: (friendship: Friendship) => void;
  }
}

export const Inbound = (props: Props) => {
  const { requests, actions } = props;


  const Actions = (friendship: Friendship) => {
    return (
      <ActionListButton
        id={`friendship-options-${friendship.entityIndex}`}
        text=''
        options={[
          { text: 'Accept', onClick: () => actions.acceptFren(friendship) },
          { text: 'Block', onClick: () => actions.blockFren(friendship.account) },
          { text: 'Decline', onClick: () => actions.cancelFren(friendship) },
        ]}
      />
    );
  }


  if (requests.length === 0) return <EmptyText>no inbound requests</EmptyText>;
  return (
    <Container>
      {requests.map((friendship) => (
        <AccountCard
          key={friendship.account.index}
          account={friendship.account}
          description={['inbound friend request']}
          actions={Actions(friendship)}
        />
      ))}
    </Container>
  );
}


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

  font-size: .9vw;
  font-family: Pixel;
`;