import styled from "styled-components";

import { ActionButton } from "layers/react/components/library";
import { ActionListButton } from "layers/react/components/library/ActionListButton";
import { Card } from "layers/react/components/library/Card";
import { Account } from "layers/react/shapes/Account";
import { Friendship } from "layers/react/shapes/Friendship";

interface Props {
  account: Account;
  actions: {
    acceptFriend: (friendship: Friendship) => void;
    blockFriend: (target: Account) => void;
    cancelFriend: (friendship: Friendship, actionText: string) => void;
  }
}

export const Requests = (props: Props) => {
  const { actions, account } = props;

  ////////////////////
  // DISPLAY

  const Body = (friendship: Friendship) => {
    return (
      <BodyContainer>
        {BodyText(friendship)}
        <BoxRow>
          {AcceptButton(friendship)}
          {OptionsButton(friendship)}
        </BoxRow>
      </BodyContainer>
    );
  }

  const BodyText = (friendship: Friendship) => {
    return (
      <BoxContainer>
        <BoxName>
          {friendship.account.name} [{friendship.account.ownerEOA.slice(0, 6)}]
        </BoxName>
        <BoxDescription>
          Wants to be your friend!
        </BoxDescription>
      </BoxContainer>
    )
  }

  const AcceptButton = (friendship: Friendship) => {
    return (
      <ActionButton
        id={`friendship-accept-${friendship.entityIndex}`}
        text="Accept"
        onClick={() => actions.acceptFriend(friendship)}
      />
    );
  }

  const OptionsButton = (friendship: Friendship) => {
    return (
      <ActionListButton
        id={`friendship-options-${friendship.entityIndex}`}
        text=""
        options={[
          {
            text: "Reject",
            onClick: () => actions.cancelFriend(friendship, `friendship over with ${friendship.target.name} !`),
          },
          {
            text: "Block",
            onClick: () => actions.blockFriend(friendship.target),
          },
        ]}
      />
    );
  }

  const FriendCards = (incoming: Friendship[], outgoing: Friendship[]) => {
    let inReqs = [...incoming] ?? [];
    let outReqs = [...outgoing] ?? [];
    return (<>
      {inReqs.reverse().map((req) => {
        return (
          <Card
            key={req.entityIndex}
            content={Body(req)}
            image="https://miladymaker.net/milady/9248.png"
          />
        );
      })}
      <CollapseText>{outgoing.length > 0 ? 'Sent requests' : ''}</CollapseText>
      {outReqs.reverse().map((req) => {
        return (
          <Card
            key={req.entityIndex}
            content={Body(req)}
            image="https://miladymaker.net/milady/9248.png"
          />
        );
      })}
    </>);
  };

  ///////////////////
  // EMPTY TEXT

  if (account.friends === undefined || account.friends!.incomingReqs.length === 0) {
    return (
      <EmptyText>
        No one wants to be your friend :/
      </EmptyText>
    );
  }

  return (
    <Container>
      {FriendCards(account.friends!.incomingReqs, account.friends!.outgoingReqs)}
    </Container>
  );
}

const Container = styled.div`
  overflow-y: scroll;
  height: 100%;
`;

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: space-between;
  height: 100%;
  width: 100%;
`;

const BoxContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 0.4vw 0.5vw;
`;

const BoxRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 0.1vw 0.5vw;
`;

const BoxName = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  padding: 0vw 0vw 0.3vw 0vw;
`;

const BoxDescription = styled.div`
  font-family: Pixel;
  text-align: left;
  font-size: 0.7vw;
  padding: 0.4vh 0.3vw;
`;

const CollapseText = styled.p`
  border: none;
  background-color: transparent;

  width: 100%;
  textAlign: center;
  padding: 0.5vw;

  color: #BBB;
  font-family: Pixel;
  font-size: 0.85vw;
  text-align: center;
`

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;
  margin: 3vh;
  height: 100%;
`;
