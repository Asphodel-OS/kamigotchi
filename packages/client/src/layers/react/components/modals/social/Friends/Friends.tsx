import { useState } from "react";
import styled from "styled-components";

import { FrenList } from "./FrenList"
import { Requests } from "./Requests";
import { Search } from "./Search";
import { searchIcon } from "assets/images/icons/actions";
import { ActionButton } from "layers/react/components/library";
import { IconButton } from "layers/react/components/library/IconButton";
import { Account } from "layers/react/shapes/Account";
import { Friendship } from "layers/react/shapes/Friendship";

interface Props {
  account: Account;
  actions: {
    acceptFriend: (friendship: Friendship) => void;
    requestFriend: (target: Account) => void;
    blockFriend: (target: Account) => void;
    cancelFriend: (friendship: Friendship, actionText: string) => void;
  }
  queries: {
    queryAccountByName: (name: string) => Account;
    queryAccountByOwner: (owner: string) => Account;
    queryFriendships: (options: any) => Friendship[];
  }
}

export type TabType = "FRIENDS" | "REQUESTS" | "SEARCH";

export const Friends = (props: Props) => {
  const { actions, account, queries } = props;

  const [tab, setTab] = useState<TabType>("FRIENDS");

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
        />
      );
    } else if (tab === "SEARCH") {
      return (
        <Search
          account={account}
          actions={actions}
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