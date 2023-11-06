import { useState } from "react";
import { EntityID } from "@mud-classic/recs";
import styled from "styled-components";

import { FrenList } from "./FrenList"
import { Requests } from "./Requests";
import { Search } from "./Search";
import { searchIcon } from "assets/images/icons/actions";
import { ActionButton } from "layers/react/components/library";
import { IconButton } from "layers/react/components/library/IconButton";
import { Tooltip } from "layers/react/components/library";

import { Account } from "layers/network/shapes/Account";
import { Friendship } from "layers/network/shapes/Friendship";

interface Props {
  account: Account;
  actions: {
    acceptFriend: (friendship: Friendship) => void;
    requestFriend: (target: Account) => void;
    blockFriend: (target: Account) => void;
    cancelFriend: (friendship: Friendship, actionText: string) => void;
  }
  queries: {
    queryAccount(id: EntityID, options?: any): Account;
    queryAccountByName: (name: string) => Account;
    queryAccountByOwner: (owner: string) => Account;
    queryFriendships: (options: any) => Friendship[];
  }
}

export type TabType = "FRIENDS" | "REQUESTS" | "SEARCH";

export const Friends = (props: Props) => {
  const { actions, account, queries } = props;

  const [tab, setTab] = useState<TabType>("FRIENDS");

  const AcceptButton = (friendship: Friendship) => {
    let text = "";
    let enabled = true;

    const senderLimit = account.friends?.limits.friends || 0;
    const senderFriends = account.friends?.friends.length || 0;
    const target = queries.queryAccount(friendship.target.id, { friends: true });
    const targetLimit = target.friends?.limits.friends || 0;
    const targetFriends = target.friends?.friends.length || 0;
    if (senderFriends >= senderLimit) {
      text = "friend limit reached";
      enabled = false;
    } else if (targetFriends >= targetLimit) {
      text = "recipient friend limit reached";
      enabled = false;
    }

    return (
      <Tooltip text={[text]}>
        <ActionButton
          id={`friendship-accept-${friendship.entityIndex}`}
          text="Accept"
          onClick={() => actions.acceptFriend(friendship)}
          disabled={!enabled}
        />
      </Tooltip>
    );
  }

  const RequestButton = (targetRaw: Account) => {
    let text = "";
    let enabled = true;

    const target = queries.queryAccount(targetRaw.id, { friends: true });
    const targetLimit = target.friends?.limits.requests || 0;
    const targetRequests = target.friends?.incomingReqs.length || 0;
    if (targetRequests >= targetLimit) {
      text = "recipient inbox full";
      enabled = false;
    }

    return (
      <Tooltip text={[text]}>
        <ActionButton
          id={`friendship-send-${target.entityIndex}`}
          text="Request"
          onClick={() => actions.requestFriend(target)}
          disabled={!enabled}
        />
      </Tooltip>
    );
  }

  ///////////////////
  // DISPLAY

  const Content = () => {
    if (tab === "FRIENDS") {
      return (
        <FrenList
          account={account}
          actions={actions}
        />
      );
    } else if (tab === "REQUESTS") {
      return (
        <Requests
          account={account}
          actions={actions}
          buttons={{ AcceptButton }}
        />
      );
    } else if (tab === "SEARCH") {
      return (
        <Search
          account={account}
          actions={actions}
          buttons={{ AcceptButton, RequestButton }}
          queries={queries}
        />
      );
    } else {
      return (
        <FrenList
          account={account}
          actions={actions}
        />
      );
    }
  }

  const Footer = (
    <FootContainer>
      <IconButton
        id='friends-search'
        onClick={() => setTab("SEARCH")}
        img={searchIcon}
      />
      <ActionButton
        id='friends-add'
        onClick={() => { tab === "FRIENDS" ? setTab("REQUESTS") : setTab("FRIENDS") }}
        text={tab === "FRIENDS" ? "Requests" : "back"}
        size='icon-medium'
      />
    </FootContainer>
  )

  return (
    <Container>
      <BodyContainer>
        {Content()}
      </BodyContainer>
      {Footer}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  height: 100%;
  width: 100%;
  padding: 0.5vh 1vw;
`;

const BodyContainer = styled.div`
  height: 100%;
  width: 100%;
  padding: 0.1vw;
`;

const FootContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const FootText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;
  margin: 3vh;
  height: 100%;
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