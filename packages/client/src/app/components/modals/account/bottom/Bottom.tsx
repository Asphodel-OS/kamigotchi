import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Account, BaseAccount } from 'network/shapes/Account';
import { Friendship } from 'network/shapes/Friendship';
import { Kami } from 'network/shapes/Kami';
import { PartyBottom } from './PartyBottom';
import { SocialBottom } from './SocialBottom/SocialBottom';
import { SubTabs } from './SocialBottom/SubTabs';
import { StatsBottom } from './StatsBottom';

interface Props {
  actions: {
    acceptFren: (friendship: Friendship) => void;
    blockFren: (account: BaseAccount) => void;
    cancelFren: (friendship: Friendship) => void;
    requestFren: (account: BaseAccount) => void;
  };
  data: {
    account: Account;
    accounts: Account[];
    vip: {
      epoch: number; // current VIP epoch
      total: number; // total of VIP scores this epoch
    };
  };
  utils: {
    getAccountKamis: (accEntity: EntityIndex) => Kami[];
  };
  view: {
    isSelf: boolean;
    setSubTab: (tab: string) => void;
    subTab: string;
    tab: string;
  };
}

export const Bottom = (props: Props) => {
  const { data, view, utils, actions } = props;
  const { acceptFren, blockFren, cancelFren, requestFren } = actions;
  const { tab, subTab, setSubTab, isSelf } = view;
  const { account } = data;

  /////////////////
  // RENDERING

  return (
    <>
      <Tab isVisible={tab === 'social'}>
        <SubTabs subTab={subTab} setSubTab={setSubTab} isSelf={isSelf} />
        <SocialBottom
          key='bottom'
          isSelf={isSelf}
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
