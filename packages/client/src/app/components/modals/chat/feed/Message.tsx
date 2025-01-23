import moment from 'moment';
import styled from 'styled-components';

import { EntityID } from '@mud-classic/recs';
import { Account } from 'app/cache/account';
import { Message as KamiMessage } from 'engine/types/kamiden/kamiden';

interface Props {
  utils: {
    getAccountByID: (accountid: EntityID) => Account;
  };
  data: {
    message: KamiMessage;
  };
}

export const Message = (props: Props) => {
  const { message } = props.data;
  const { getAccountByID } = props.utils;

  /////////////////
  // INTERPRETATION

  /////////////////
  // INTERACTION

  /*
      <Pfp
        src={cast.author.pfp_url}
        onClick={() => window.open(`${baseUrl}/${cast.author.username}`)}
      />
      */
  console.log(` getAccountByID ${JSON.stringify(getAccountByID(message.AccountId as EntityID))}`);
  console.log(`message.AccountId ${message.AccountId}`);
  return (
    <Container>
      <Content>
        <Header>
          <Author>{getAccountByID(message.AccountId as EntityID).name}</Author>
          <Room>{message.RoomIndex}</Room>
          <Time>{moment(message.Timestamp).format('MM/DD HH:mm')}</Time>
        </Header>
        <Body>{message.Message}</Body>
      </Content>
    </Container>
  );

  /////////////////
  // HELPERS

  // trigger a like of a cast
};

const Container = styled.div`
  padding: 0.9vw 0.9vw;
  width: 100%;

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
  margin-right: 0.4vw;
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
  gap: 0.4vw;
`;

const Author = styled.div`
  color: orange;
  font-family: Pixel;
  font-size: 1vw;

  &:hover {
    opacity: 0.6;
    cursor: pointer;
  }
`;

const Room = styled.div`
  color: green;
  font-family: Pixel;
  font-size: 1vw;

  &:hover {
    opacity: 0.6;
    cursor: pointer;
  }
`;

const Time = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 0.9vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.4vw;
`;

const Body = styled.div`
  color: black;
  width: 100%;

  font-family: Pixel;
  font-size: 0.8vw;
  line-height: 1.2vw;
  word-wrap: break-word;

  &:hover {
    opacity: 0.6;
    cursor: pointer;
  }
`;
