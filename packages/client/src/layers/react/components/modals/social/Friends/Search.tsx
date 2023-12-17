import { useState } from "react";
import styled from "styled-components";

import { ActionButton } from "layers/react/components/library";
import { ActionListButton } from "layers/react/components/library/ActionListButton";
import { Card } from "layers/react/components/library/Card";
import { SingleInputTextForm } from 'layers/react/components/library/SingleInputTextForm';
import { Account } from "layers/react/shapes/Account";
import { Friendship } from "layers/react/shapes/Friendship";

interface Props {
  account: Account;
  actions: {
    requestFriend: (target: Account) => void;
    acceptFriend: (friendship: Friendship) => void;
    blockFriend: (target: Account) => void;
    cancelFriend: (friendship: Friendship, actionText: string) => void;
  }
  queries: {
    queryAccountByName: (name: string) => Account;
    queryAccountByOwner: (owner: string) => Account;
    queryFriendships: (options: any) => Friendship[];
  }
}

export const Search = (props: Props) => {
  const { actions, account, queries } = props;

  ////////////////////
  // SEARCH

  const [searchText, setSearchText] = useState<string>("search by name");
  const [searchResult, setSearchResult] = useState<Account>();

  const searchByName = (name: string) => {
    const result = queries.queryAccountByName(name);
    setSearchResult(result);
    setSearchText(name);
  }

  ////////////////////
  // INTERPRETATIONS

  const getStatus = (acc: Account, tar: Account) => {
    const outgoingFS = queries.queryFriendships({ account: acc, target: tar });
    const incomingFS = queries.queryFriendships({ account: tar, target: acc });

    let outStatus = "";
    let inStatus = "";

    if (outgoingFS.length > 0) outStatus = outgoingFS[0].state;
    if (incomingFS.length > 0) inStatus = incomingFS[0].state;

    if (outStatus === "" && inStatus === "") return "EMPTY";
    else if (outStatus === "FRIENDS" && inStatus === "FRIENDS") return "FRIENDS";
    else if (outStatus === "REQUESTED") return "OUTGOING_REQUESTED";
    else if (inStatus === "REQUESTED") return "INCOMING_REQUEST";
    else if (outStatus === "BLOCKED" && inStatus === "BLOCKED") return "DOUBLE_BLOCKED";
    else if (outStatus === "BLOCKED") return "OUTGOING_BLOCKED";
    else if (inStatus === "BLOCKED") return "INCOMING_BLOCKED";
    else return "ERROR";
  }

  ////////////////////
  // DISPLAY

  const Body = (target: Account | undefined) => {
    if (target === undefined) return <div></div>;

    const status = getStatus(account, target);

    return (
      <BodyContainer>
        {BodyText(target)}
        <BoxRow>
          {MainButton(target, status)}
          {OptionsButton(target, status)}
        </BoxRow>
      </BodyContainer>
    );
  }

  const BodyText = (acc: Account) => {
    return (
      <BoxContainer>
        <BoxName>
          {acc.name} [{acc.ownerEOA.slice(0, 6)}]
        </BoxName>
      </BoxContainer>
    )
  }

  const MainButton = (target: Account, status: string) => {
    if (status === "EMPTY") {
      // not friends yet, maybe request?
      return (
        <ActionButton
          id={`friendship-send-${target.entityIndex}`}
          text="Accept"
          onClick={() => actions.requestFriend(target)}
        />
      );
    } else if (status === "INCOMING_REQUEST") {
      // incoming request, accept?
      const fs = queries.queryFriendships({ account: target, target: account });
      return (
        <ActionButton
          id={`friendship-accept-${target.entityIndex}`}
          text="Accept"
          onClick={() => actions.acceptFriend(fs[0])}
        />
      );
    } else if (status === "OUTGOING_BLOCKED" || status === "DOUBLE_BLOCKED") {
      // blocked, unblock?
      const fs = queries.queryFriendships({ account: target, target: account });
      return (
        <ActionButton
          id={`friendship-block-${target.entityIndex}`}
          text="Unblock"
          onClick={() => actions.cancelFriend(fs[0], "Unblocking account")}
        />
      );
    } else {
      return <div></div>;
    }
  }

  const OptionsButton = (target: Account, status: string) => {
    const options = [];

    if (status === "FRIENDS") {
      const friendship = queries.queryFriendships({ account: account, target: target })[0];
      options.push({
        text: "Unfriend",
        onClick: () => actions.cancelFriend(friendship, `friendship over with ${friendship.target.name} !`),
      });
    } else if (status === "INCOMING_REQUEST") {
      const friendship = queries.queryFriendships({ account: target, target: account })[0];
      options.push({
        text: "Reject friend request",
        onClick: () => actions.cancelFriend(friendship, `rejecting ${friendship.target.name}`),
      });
    } else if (status === "OUTGOING_REQUESTED") {
      const friendship = queries.queryFriendships({ account: account, target: target })[0];
      options.push({
        text: "Cancel outgoing request",
        onClick: () => actions.cancelFriend(friendship, `don't want ${friendship.target.name} anymore!`),
      });
    }

    if (status !== "OUTGOING_BLOCKED" && status !== "DOUBLE_BLOCKED") {
      const friendship = queries.queryFriendships({ account: account, target: target })[0];
      options.push({
        text: "Block",
        onClick: () => actions.blockFriend(friendship.target),
      });
    }

    if (options.length === 0) return <div></div>;

    return (
      <ActionListButton
        id={`friendship-options-${target.entityIndex}`}
        text=""
        options={options}
      />
    );
  }

  const ResultCard = () => {
    if (searchResult === undefined || searchResult.name === undefined)
      if (searchText === "search by name") return <div></div>
      else return (
        <EmptyText>
          No account found for [{searchText}]
        </EmptyText>
      );
    return (
      <Card
        key={searchResult!.entityIndex}
        content={Body(searchResult)}
        image="https://miladymaker.net/milady/9248.png"
      />
    );
  };

  return (
    <Container>
      <div style={{
        width: "100%",
        display: "flex",
        alignContent: "center",
      }}>
        <SingleInputTextForm
          id={`kami-name`}
          placeholder={searchText}
          onSubmit={(v: string) => searchByName(v)}
          fullWidth
        />
      </div>
      {ResultCard()}
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
