import { EntityIndex } from '@mud-classic/recs';
import CakeIcon from '@mui/icons-material/Cake';
import moment from 'moment';
import styled from 'styled-components';

import { Overlay, Popover, Text, TextTooltip } from 'app/components/library';
import { ActionIcons } from 'assets/images/icons/actions';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Friends as FriendsType } from 'network/shapes/Account/friends';
import { Friendship } from 'network/shapes/Friendship';
import { Kami } from 'network/shapes/Kami';
import { Account as PlayerAccount } from 'app/stores';
import { abbreviateAddress } from 'utils/address';
import { playClick } from 'utils/sounds';
import { Bio } from './Bio';
import { FriendActions } from './FriendActions';
import { Pfp } from './Pfp';

export const Header = ({
  account,
  actions: {
    setBio,
    handlePfpChange,
    requestFren,
    cancelFren,
    blockFren,
    acceptFren,
  },
  isLoading,
  isSelf,
  player,
  utils: {
    getAccountKamis,
    getFriends,
  },
}: {
  account: Account; // account selected for viewing
  actions: {
    setBio: (bio: string) => void;
    handlePfpChange: (kami: Kami) => void;
    requestFren: (account: BaseAccount) => void;
    cancelFren: (friendship: Friendship) => void;
    blockFren: (account: BaseAccount) => void;
    acceptFren: (friendship: Friendship) => void;
  };
  isLoading: boolean;
  isSelf: boolean;
  player: PlayerAccount;
  utils: {
    getAccountKamis: (accEntity: EntityIndex) => Kami[];
    getFriends: (accEntity: EntityIndex) => FriendsType;
  };
}) => {
  const copyText = (text: string) => {
    playClick();
    navigator.clipboard.writeText(text);
  };

  /////////////////
  // RENDERING

  const KamisDropDown = () => {
    let kamis = getAccountKamis(account.entity).map((kami) => (
      <KamiDropDown
        disabled={account.pfpURI === kami.image}
        key={kami.id}
        onClick={() => {
          handlePfpChange(kami);
        }}
      >
        {kami.name}
      </KamiDropDown>
    ));
    if (kamis.length === 0) {
      kamis = [<div style={{ padding: `0.5em` }}>No Kamis</div>];
    }
    return kamis;
  };

  return (
    <Container>
      <Overlay top={0.75} right={0.75}>
        <Text size={0.6}>#{account.index}</Text>
      </Overlay>
      {isSelf ? (
        <Popover cursor={`url(${ActionIcons.edit}), auto`} key='profile' content={KamisDropDown()}>
          <Pfp account={account} isLoading={isLoading} />
        </Popover>
      ) : (
        <Pfp account={account} isLoading={isLoading} />
      )}
      <Info>
        <TitleSection>
          <Text size={1.2}>{account.name}</Text>
          <TextTooltip title='Owner Address' text={[account.ownerAddress, '\n', '(click to copy)']}>
            <Subtitle onClick={() => copyText(account.ownerAddress)}>
              {abbreviateAddress(account.ownerAddress)}
            </Subtitle>
          </TextTooltip>
        </TitleSection>
        {!isSelf && (
          <FriendActions
            account={account}
            player={player}
            utils={{ getFriends }}
            actions={{ requestFren, acceptFren, cancelFren, blockFren }}
          />
        )}
        <DetailRow>
          <CakeIcon style={{ height: '1.4em' }} />
          <Description>{moment(1000 * account.time.creation).format('MMM DD, YYYY')}</Description>
        </DetailRow>
        <Bio account={account} isSelf={isSelf} actions={{ setBio }} />
      </Info>
    </Container>
  );
};

const Container = styled.div`
  padding: 0.75em;
  display: flex;
  flex-flow: row nowrap;
  gap: 0.9em;
  align-items: flex-start;
  user-select: none;
`;

const Info = styled.div`
  width: 100%;
  padding-bottom: 1.5em;
  gap: 0.3em;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
`;

const TitleSection = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 0.3em;
  margin-bottom: 0.6em;
`;

const Subtitle = styled.div`
  color: #777;
  padding-left: 0.5em;
  font-size: 0.7em;
  cursor: copy;
`;

const DetailRow = styled.div<{ edit?: boolean }>`
  padding: 0.15em 0;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  ${({ edit }) => edit && `cursor: pointer`}
`;

const Description = styled.div`
  font-size: 0.7em;
  line-height: 0.9em;
`;

const KamiDropDown = styled.button`
  padding: 0.5em;
  display: flex;
  flex-direction: column;
  width: 100%;
  &:hover {
    cursor: pointer;
  }
  &:disabled {
    cursor: auto;
    background-color: #ccc;
    color: #666;
  }
`;
