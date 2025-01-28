import moment from 'moment';
import styled from 'styled-components';

import { EntityID } from '@mud-classic/recs';
import { Account } from 'app/cache/account';
import { Message as KamiMessage } from 'engine/types/kamiden/kamiden';
import { formatEntityID } from 'engine/utils';

interface Props {
  utils: {
    getAccountByID: (accountid: EntityID) => Account;
  };
  data: {
    message: KamiMessage;
  };
  player: EntityID;
}

export const Message = (props: Props) => {
  const { message } = props.data;
  const { getAccountByID } = props.utils;
  const { player } = props;

  /////////////////
  // INTERPRETATION

  /////////////////
  // INTERACTION
  return (
    <Container>
      {player != getAccountByID(formatEntityID(message.AccountId)).id ? (
        <Content>
          <Header>
            <PfpAuthor>
              <Pfp
                src={
                  getAccountByID(formatEntityID(message.AccountId)).pfpURI ??
                  'https://miladymaker.net/milady/8365.png'
                }
              />
              <Author>{getAccountByID(formatEntityID(message.AccountId)).name}</Author>
            </PfpAuthor>
            <Time>{moment(message.Timestamp * 1000).format('MM/DD HH:mm')}</Time>
          </Header>
          <Body>{message.Message}</Body>
        </Content>
      ) : (
        <Content>
          <Header>
            <Time>{moment(message.Timestamp * 1000).format('MM/DD HH:mm')}</Time>
            <PfpAuthor>
              <Author>{getAccountByID(formatEntityID(message.AccountId)).name}</Author>
              <Pfp
                src={
                  getAccountByID(formatEntityID(message.AccountId)).pfpURI ??
                  'https://miladymaker.net/milady/8365.png'
                }
              />{' '}
            </PfpAuthor>
          </Header>
          <BodyMine>{message.Message}</BodyMine>
        </Content>
      )}
    </Container>
  );

  /////////////////
  // HELPERS

  // trigger a like of a cast
};

const Container = styled.div`
  padding: 0.9vw 0.9vw;
  width: 115%;

  color: black;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
  gap: 0.4vw;
`;

const Content = styled.div`
  width: 85%;
  color: black;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Pfp = styled.img`
  width: 3.6vw;
  height: 3.6vw;
  border-radius: 50%;
  &:hover {
    opacity: 0.6;
    cursor: pointer;
  }
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

const Author = styled.div`
  color: orange;
  font-size: 1vw;
`;

const Time = styled.div`
  color: black;

  font-size: 0.9vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const Body = styled.div`
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
  }
`;

const BodyMine = styled.div`
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
  ::before {
    z-index: -1;
    content: '';
    position: absolute;
    top: -0.8vw;
    min-height: 2vw;
    width: 0.7vw;
    background: rgb(238, 238, 238);
    border-top-right-radius: 80%;
    right: 4%;
  }
`;
