import { useEffect, useState } from "react";
import styled from "styled-components";

import { FrenList } from "./FrenList"
import { Header } from "./Header"
import { Requests } from "./Requests";
import { Search } from "./Search";

import { feedIcon, reviveIcon } from "assets/images/icons/actions";
import { ActionButton } from "layers/react/components/library/ActionButton";
import { IconButton } from "layers/react/components/library/IconButton";
import { IconListButton } from "layers/react/components/library/IconListButton";
import { ModalWrapperLite } from "layers/react/components/library/ModalWrapper";
import { Card } from "layers/react/components/library/Card";
import { Tooltip } from "layers/react/components/library/Tooltip";
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
    } else if (tab === "SEARCH") {
      return (
        <Search
          account={account}
          actions={actions}
          queries={queries}
        />
      );
    } else if (tab === "REQUESTS") {
      return (
        <Requests
          account={account}
          actions={actions}
        />
      );
    }
  }

  return (
    <div>
      <Header
        tab={tab}
        setTab={setTab}
      />
      {Content()}
    </div>
  );
}

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;
  margin: 3vh;
  height: 100%;
`;