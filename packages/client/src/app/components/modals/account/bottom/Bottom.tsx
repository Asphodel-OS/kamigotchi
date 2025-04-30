import styled from 'styled-components';

import { EntityIndex } from '@mud-classic/recs';

import { Account, BaseAccount } from 'network/shapes/Account';
import { Friendship } from 'network/shapes/Friendship';
import { Kami } from 'network/shapes/Kami';
import { SubTabs } from '../tabs/SubTabs';
import { PartyBottom } from './PartyBottom';
import { SocialBottom } from './SocialBottom';
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
  network: { world: any; components: any };
}

export const Bottom = (props: Props) => {
  const { data, tab, subTab, setSubTab, utils, actions, isSelf, network } = props;
  const { acceptFren, blockFren, cancelFren, requestFren } = actions;
  const { account } = data;
  const { world, components } = network;

  /////////////////
  // RENDERING

  return (
    <>
      {tab === 'social' && (
        <>
          <SubTabs subTab={subTab} setSubTab={setSubTab} isSelf={isSelf} />
          <SocialBottom
            key='bottom'
            subTab={subTab}
            data={data}
            actions={{ acceptFren, blockFren, cancelFren, requestFren }}
            utils={utils}
          />
        </>
      )}
      {tab === 'stats' && <StatsBottom key='statsbottom' data={{ account }} />}
      {tab === 'party' && <PartyBottom data={{ account }} utils={utils} key='partybottom' />}
    </>
  );
};

const Container = styled.div`
  border: solid 0.15vw black;
  border-radius: 0 0 0.6vw 0.6vw;
  width: 100%;
  height: 100%;
  background-color: white;
  padding: 0.45vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;

  overflow-y: auto;
`;
