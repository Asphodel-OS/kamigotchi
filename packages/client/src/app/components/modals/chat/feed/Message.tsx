import { EntityID, EntityIndex } from '@mud-classic/recs';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Account } from 'app/cache/account';
import { Popover } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Message as KamiMessage } from 'clients/kamiden/proto';
import { KAMI_BASE_URI } from 'constants/media';
import { formatEntityID } from 'engine/utils';
import { BaseAccount } from 'network/shapes/Account';
import { ActionSystem } from 'network/systems';

export const Message = ({
  previousEqual,
  utils: {
    getAccount,
    getEntityIndex
  },
  data: {
    message,
  },
  player,
  actionSystem,
  api,
}: {
  previousEqual: boolean;
  utils: {
    getAccount: (entityIndex: EntityIndex) => Account;
    getEntityIndex: (entity: EntityID) => EntityIndex;
  };
  data: {
    message: KamiMessage;
  };
  player: Account;
  actionSystem: ActionSystem;
  api: {
    player: {
      account: {
        friend: { block: (account: string) => void; request: (account: string) => void };
      };
    };
  };
}) => {
  const [yours, setYours] = useState(false);
  const { modals, setModals } = useVisibility();
  const { setAccount } = useSelected();
  const pfpRef = useRef<HTMLDivElement>(null);

  /////////////////
  // INTERPRETATION
  const getAccountFunc = () => {
    return getAccount(getEntityIndex(formatEntityID(message.AccountId)));
  };

  // TODO: fix this
  useEffect(() => {
    setYours(player.id !== getAccountFunc().id);
  }, [message.AccountId, player.id]);

  const showUser = () => {
    setAccount(getAccountFunc().index);
    if (!modals.account) setModals({ account: true, party: false, map: false });
  };

  const blockFren = (account: BaseAccount) => {
    actionSystem.add({
      action: 'BlockFriend',
      params: [account.ownerAddress],
      description: `Blocking ${account.name}`,
      execute: async () => {
        return api.player.account.friend.block(account.ownerAddress);
      },
    });
  };

  const requestFren = (account: BaseAccount) => {
    actionSystem.add({
      action: 'RequestFriend',
      params: [account.ownerAddress],
      description: `Sending ${account.name} Friend Request`,
      execute: async () => {
        return api.player.account.friend.request(account.ownerAddress);
      },
    });
  };

  /////////////////
  // INTERACTION

  const options = [
    {
      text: 'Add',
      onClick: () => requestFren(getAccountFunc()),
    },

    {
      text: 'Block',
      onClick: () => blockFren(getAccountFunc()),
    },
  ];
  const optionsMap = () => {
    return options.map((option, i) => (
      <PopOverButtons key={i}>
        <button style={{ padding: `0.4em`, width: ` 100%` }} onClick={() => option.onClick()}>
          {option.text}
        </button>
      </PopOverButtons>
    ));
  };

  return (
    <Container>
      <Content>
        {
          <Header yours={yours}>
            {player.id != getAccountFunc().id ? (
              <>
                <PfpAuthor id='pfp-author' ref={pfpRef}>
                  <Popover content={optionsMap()} mouseButton={2}>
                    <Pfp
                      author={false}
                      onClick={() => {
                        showUser();
                      }}
                      src={`${KAMI_BASE_URI}${getAccountFunc().pfpURI}.gif`}
                    />
                  </Popover>
                  <Body previousEqual={previousEqual} yours={yours}>
                    <Time>
                      <Name>{getAccountFunc().name}</Name>
                      {moment(message.Timestamp).format('MM/DD HH:mm')}
                    </Time>
                    {message.Message}
                  </Body>
                </PfpAuthor>
              </>
            ) : (
              <>
                <PfpAuthor>
                  <Body previousEqual={previousEqual} yours={yours}>
                    <Time>
                      <Name>{getAccountFunc().name}</Name>
                      {moment(message.Timestamp).format('MM/DD HH:mm')}
                    </Time>
                    {message.Message}
                  </Body>
                  <Pfp
                    author={true}
                    onClick={() => {
                      showUser();
                    }}
                    src={`${KAMI_BASE_URI}${getAccountFunc().pfpURI}.gif`}
                  />
                </PfpAuthor>
              </>
            )}
          </Header>
        }
      </Content>
    </Container>
  );
};

const Container = styled.div`
  padding: 0em 0.9em;
  width: 100%;

  color: black;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
  gap: 0.4em;
  caret-color: transparent;
`;

const Content = styled.div`
  width: 100%;
  color: black;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Pfp = styled.img<{ author: boolean }>`
  position: relative;
  left: -0.5em;
  width: 3.6em;
  height: 3.6em;
  border-radius: 50%;
  &:hover {
    opacity: 0.6;
    cursor: pointer;
  }

  ${({ author }) =>
    author &&
    `  pointer-events: none;
    left: 0em;
  `}
`;

const Header = styled.div<{ yours: boolean }>`
  margin-top: 0.2em;
  width: 100%;
  color: black;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;

  gap: 0.6em;
`;

const PfpAuthor = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5em;
  justify-content: flex-end;
  align-items: flex-start;
`;

const Time = styled.div`
  color: #a3a3a3;
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
`;

const Name = styled.div`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 9ch;
  margin-right: 0.5em;
  justify-content: flex-start;
  color: black;
  font-weight: bold;
`;

const PopOverButtons = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Body = styled.div<{ yours: boolean; previousEqual: boolean }>`
  z-index: 0;
  color: black;
  width: 86%;

  font-size: 0.6em;
  line-height: 1.2em;
  word-wrap: break-word;

  border-radius: 1em;
  padding: 0.4em 0.4em 0.4em 0.8em;
  margin: 0.2em 0 0.2em 0;
  display: inline-block;
  align-items: flex-start;

  background-color: #eee;
  position: relative;

  ${({ yours, previousEqual }) =>
    yours
      ? `
  ::before {
    z-index: -1;
    content: '';
    position: absolute;
   top: 1.7em;
    min-height: 2em;
    width: 0.7em;
    background: rgb(238, 238, 238);
    border-top-left-radius: 80%;
    left: 0;   
    rotate: -90deg;
  }`
      : ` ::before {
    z-index: -1;
    content: "";
    position: absolute;
    top: 1.7em;
    min-height: 2em;
    width: 0.7em;
    background: rgb(238, 238, 238);
    border-top-right-radius: 80%;
    right: 0; 
    rotate: 90deg;
  } `}
`;
