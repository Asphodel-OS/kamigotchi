import moment from 'moment';
import styled from 'styled-components';

import { EntityID } from '@mud-classic/recs';
import { Account } from 'app/cache/account';

import { useSelected, useVisibility } from 'app/stores';
import { Message as KamiMessage } from 'engine/types/kamiden/kamiden';
import { formatEntityID } from 'engine/utils';
import { BaseAccount } from 'network/shapes/Account';

import { Popover } from 'app/components/library/base/Popover';
import { ActionSystem } from 'network/systems';
import { useEffect, useRef, useState } from 'react';

interface Props {
  previousMessage: string;
  utils: {
    getAccountByID: (accountid: EntityID) => Account;
  };
  data: {
    message: KamiMessage;
  };
  player: Account;
  actionSystem: ActionSystem;
  api: {
    player: {
      social: {
        friend: { block: (account: string) => void; request: (account: string) => void };
      };
    };
  };
}

export const Message = (props: Props) => {
  const { message } = props.data;
  const { getAccountByID } = props.utils;
  const { actionSystem, api, previousMessage } = props;

  const { player } = props;
  const [yours, setYours] = useState(false);
  const { modals, setModals } = useVisibility();
  const { setAccount } = useSelected();
  const pfpRef = useRef<HTMLDivElement>(null);

  /////////////////
  // INTERPRETATION

  useEffect(() => {
    if (player.id != getAccountByID(formatEntityID(message.AccountId)).id) {
      setYours(true);
    }
  }, [message.AccountId]);

  const showUser = () => {
    setAccount(getAccountByID(formatEntityID(message.AccountId)).index);
    if (!modals.account) setModals({ account: true });
  };

  const getAccount = () => {
    return getAccountByID(formatEntityID(message.AccountId));
  };

  const blockFren = (account: BaseAccount) => {
    console.log('block fren');
    actionSystem.add({
      action: 'BlockFriend',
      params: [account.ownerAddress],
      description: `Blocking ${account.name}`,
      execute: async () => {
        return api.player.social.friend.block(account.ownerAddress);
      },
    });
  };

  const requestFren = (account: BaseAccount) => {
    actionSystem.add({
      action: 'RequestFriend',
      params: [account.ownerAddress],
      description: `Sending ${account.name} Friend Request`,
      execute: async () => {
        return api.player.social.friend.request(account.ownerAddress);
      },
    });
  };

  /////////////////
  // INTERACTION

  const options = [
    {
      text: 'Add',
      onClick: () => requestFren(getAccount()),
    },

    {
      text: 'Block',
      onClick: () => blockFren(getAccount()),
    },
  ];
  const optionsMap = () => {
    return options.map((option, i) => (
      <PopOverButtons>
        <button
          style={{ padding: `0.4vw`, width: ` 6vw` }}
          key={`div-${i}`}
          onClick={() => option.onClick()}
        >
          {option.text}
        </button>
      </PopOverButtons>
    ));
  };

  return (
    <Container>
      <Content>
        {previousMessage !== message.AccountId && (
          <Header>
            {player.id != getAccount().id ? (
              <>
                <PfpAuthor id='pfp-author' ref={pfpRef}>
                  <Popover content={optionsMap()} clickMouse={2}>
                    <Pfp
                      author={false}
                      onClick={() => {
                        showUser();
                      }}
                      src={getAccount().pfpURI ?? 'https://miladymaker.net/milady/8365.png'}
                    />
                  </Popover>

                  <Author author={false}>{getAccount().name}</Author>
                </PfpAuthor>
                <Time>{moment(message.Timestamp * 1000).format('MM/DD HH:mm')}</Time>
              </>
            ) : (
              <>
                <Time>{moment(message.Timestamp * 1000).format('MM/DD HH:mm')}</Time>
                <PfpAuthor>
                  <Author author={true}>{getAccount().name}</Author>
                  <Pfp
                    author={true}
                    onClick={() => {
                      showUser();
                    }}
                    src={getAccount().pfpURI ?? 'https://miladymaker.net/milady/8365.png'}
                  />
                </PfpAuthor>
              </>
            )}
          </Header>
        )}
        <Body yours={yours}>{message.Message}</Body>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  padding: 0vw 0.9vw;
  width: 115%;

  color: black;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
  gap: 0.4vw;
  caret-color: transparent;
`;

const Content = styled.div`
  width: 85%;
  color: black;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Pfp = styled.img<{ author: boolean }>`
  position: relative;
  left: -0.5vw;
  width: 3.6vw;
  height: 3.6vw;
  border-radius: 50%;
  &:hover {
    opacity: 0.6;
    cursor: pointer;
  }

  ${({ author }) =>
    author &&
    `  pointer-events: none;
    left: 0vw;
  `}
`;

const Header = styled.div`
  padding-bottom: 0.6vw;
  width: 100%;
  color: black;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;

  gap: 0.6vw;
`;

const PfpAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5vw;
`;

const Author = styled.div<{ author: boolean }>`
  position: relative;
  left: -0.5vw;
  color: orange;
  font-size: 1vw;
  ${({ author }) =>
    author &&
    `  left:0;
  `}
`;

const Time = styled.div`
  color: black;

  font-size: 0.9vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const PopOverButtons = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Body = styled.div<{ yours: boolean }>`
  z-index: 0;
  color: black;
  width: 100%;

  font-size: 0.8vw;
  line-height: 1.2vw;
  word-wrap: break-word;

  border-radius: 1vw;
  padding: 1vw;
  margin: 0.5vh 0 1vh 0;
  display: inline-block;
  align-items: flex-start;
  margin-right: 25%;
  background-color: #eee;
  position: relative;

  ${({ yours }) =>
    yours
      ? `
  ::before {
    z-index: -1;
    content: '';
    position: absolute;
    top: -0.8vw;
    min-height: 2vw;
    width: 0.7vw;
    background: rgb(238, 238, 238);
    border-top-left-radius: 80%;
    left: 2%;
  }`
      : ` ::before {
    z-index: -1;
    content: '';
    position: absolute;
    top: -0.8vw;
    min-height: 2vw;
    width: 0.7vw;
    background: rgb(238, 238, 238);
    border-top-right-radius: 80%;
    right: 4%;
  } `}
`;
