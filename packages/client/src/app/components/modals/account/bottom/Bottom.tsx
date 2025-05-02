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
  tab: string;
  subTab: string;
  isSelf: boolean;
  setSubTab: (tab: string) => void;
  data: {
    account: Account;
    getAllAccs: () => BaseAccount[];
  };
  actions: {
    acceptFren: (friendship: Friendship) => void;
    blockFren: (account: BaseAccount) => void;
    cancelFren: (friendship: Friendship) => void;
    requestFren: (account: BaseAccount) => void;
  };
  utils: {
    getAccountKamis: (accEntity: EntityIndex) => Kami[];
  };
}

export const Bottom = (props: Props) => {
  const { data, tab, subTab, setSubTab, utils, actions, isSelf } = props;
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
        <StatsBottom key='statsbottom' data={{ account }} />
      </Tab>
      <Tab isVisible={tab === 'party'}>
        <PartyBottom data={{ account }} utils={utils} key='partybottom' />
      </Tab>
    </>
  );
};

const Tab = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;flex-direction: column;` : `display: none;`)}
`;
