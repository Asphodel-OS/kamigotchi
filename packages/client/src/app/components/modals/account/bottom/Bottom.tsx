import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Account as PlayerAccount } from 'app/stores';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Friends } from 'network/shapes/Account/friends';
import { Friendship } from 'network/shapes/Friendship';
import { Kami } from 'network/shapes/Kami';
import { PartyBottom } from './PartyBottom';
import { SocialBottom } from './SocialBottom/SocialBottom';
import { SubTabs } from './SocialBottom/SubTabs';
import { StatsBottom } from './StatsBottom';

export const Bottom = ({
  actions,
  data,
  utils,
  view: {
    tab,
    subTab,
    setSubTab,
    isSelf,
  },
}: {
  actions: {
    acceptFren: (friendship: Friendship) => void;
    blockFren: (account: BaseAccount) => void;
    cancelFren: (friendship: Friendship) => void;
    requestFren: (account: BaseAccount) => void;
  };
  data: {
    account: Account;
    accounts: Account[];
    isSelf: boolean;
    player: PlayerAccount;
    vip: {
      epoch: number; // current VIP epoch
      total: number; // total of VIP scores this epoch
    };
  };
  utils: {
    getAccountKamis: (accEntity: EntityIndex) => Kami[];
    getFriends: (accEntity: EntityIndex) => Friends;
  };
  view: {
    isSelf: boolean;
    setSubTab: (tab: string) => void;
    subTab: string;
    tab: string;
  };
}) => {
  const { acceptFren, blockFren, cancelFren, requestFren } = actions;
  const { account } = data;

  /////////////////
  // RENDERING

  return (
    <>
      <Tab isVisible={tab === 'social'}>
        <SubTabs subTab={subTab} setSubTab={setSubTab} isSelf={isSelf} />
        <SocialBottom
          key='bottom'
          subTab={subTab}
          data={data}
          actions={{ acceptFren, blockFren, cancelFren, requestFren }}
          utils={utils}
        />
      </Tab>
      <Tab isVisible={tab === 'stats'}>
        <StatsBottom key='statsbottom' data={data} />
      </Tab>
      <Tab isVisible={tab === 'party'}>
        <PartyBottom key='partybottom' data={{ account }} utils={utils} />
      </Tab>
    </>
  );
};

const Tab = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;flex-direction: column;` : `display: none;`)}
`;
