import { useEffect, useState } from "react";
import styled from "styled-components";

import { ActionButton } from "layers/react/components/library";
import { ActionListButton } from "layers/react/components/library/ActionListButton";
import { Card } from "layers/react/components/library/Card";
import { useIcon } from "assets/images/icons/actions";
import { Tooltip } from "layers/react/components/library/Tooltip";
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

export const IncomingReqs = (props: Props) => {
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
            onClick: () => actions.cancelFriend(friendship, `unfriending ${friendship.target.name}`),
          },
          {
            text: "Block",
            onClick: () => actions.blockFriend(friendship.target),
          },
        ]}
      />
    );
  }

  const FriendCards = (reqs: Friendship[]) => {
    let myReqs = [...reqs] ?? [];
    return <>{myReqs.reverse().map((req) => {
      return (
        <Card
          key={req.entityIndex}
          content={Body(req)}
          image="https://miladymaker.net/milady/9248.png"
        />
      );
    })}
    </>;
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
      {FriendCards(account.friends!.incomingReqs)}
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

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;
  margin: 3vh;
  height: 100%;
`;
