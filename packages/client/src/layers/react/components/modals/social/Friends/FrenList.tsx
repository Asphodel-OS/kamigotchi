import styled from "styled-components";

import { ActionListButton } from "layers/react/components/library/ActionListButton";
import { Card } from "layers/react/components/library/Card";
import { Account } from "layers/network/shapes/Account";
import { Friendship } from "layers/network/shapes/Friendship";

interface Props {
  account: Account;
  actions: {
    blockFriend: (target: Account) => void;
    cancelFriend: (friendship: Friendship, actionText: string) => void;
  }
}

export const FrenList = (props: Props) => {
  const { actions, account } = props;

  ////////////////////
  // DISPLAY

  const Body = (friendship: Friendship) => {
    return (
      <BodyContainer>
        {BodyText(friendship)}
        <BoxRow>
          {OptionsButton(friendship)}
        </BoxRow>
      </BodyContainer>
    );
  }

  const BodyText = (friendship: Friendship) => {
    return (
      <BoxContainer>
        <BoxName>
          {friendship.target.name} [{friendship.target.ownerEOA.slice(0, 6)}]
        </BoxName>
        <BoxDescription>
          is a fren!
        </BoxDescription>
      </BoxContainer>
    )
  }

  const OptionsButton = (friendship: Friendship) => {
    return (
      <ActionListButton
        id={`friendship-options-${friendship.entityIndex}`}
        text=""
        options={[
          {
            text: "Unfriend",
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

  const FriendCards = (frens: Friendship[]) => {
    let myFrens = [...frens] ?? [];
    return <>{myFrens.reverse().map((fren) => {
      return (
        <Card
          key={fren.entityIndex}
          content={Body(fren)}
          image="https://miladymaker.net/milady/9248.png"
        />
      );
    })}
    </>;
  };

  ///////////////////
  // EMPTY TEXT

  if (account.friends === undefined || account.friends!.friends.length === 0) {
    return (
      <EmptyText>
        You have no friends. Touch some grass?
      </EmptyText>
    );
  }

  return FriendCards(account.friends!.friends);
}

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
