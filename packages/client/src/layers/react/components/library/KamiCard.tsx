import React from 'react';
import styled from 'styled-components';

interface Props {
  kami: Kami;
  title: string;
  image: string;
  subtext: string;
  description: string[];
  cornerContent?: React.ReactNode;
  action: React.ReactNode;
}

interface Kami {
  id: string;
  index: string;
  name: string;
  uri: string;
  power: number;
  health: number;
  currHealth: number;
  lastHealthTime: number;
}

interface Production {
  id: string;
  nodeId: string;
  state: string;
  startTime: number;
  collect?: Function;
  start?: Function;
  stop?: Function;
}

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current production or death as well as support common actions.
export const KamiCard = (props: Props) => {

  const Description = () => {
    const header = [<TextBig>{props.description[0]}</TextBig>];

    const details = props.description.slice(1).map((line) => (
      <TextMedium>{line}</TextMedium>
    ));
    return [...header, ...details];
  };

  return (
    <Card key={props.kami.id}>
      <Image src={props.image} />
      <Container>
        <TitleBar>
          <TitleText>{props.title}</TitleText>
          <TitleCorner>{props.cornerContent}</TitleCorner>
        </TitleBar>
        <Content>
          <ContentColumn>{Description()}</ContentColumn>
          <ContentColumn>
            <ContentSubtext>{props.subtext}</ContentSubtext>
            <ContentActions>
              {props.action}
            </ContentActions>
          </ContentColumn>
        </Content>
      </Container>
    </Card>
  )
}


const Card = styled.div`
  background-color: #ffffff;
  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  color: black;
  margin: 4px 2px;

  display: flex;
  flex-flow: row nowrap;
`;

const Image = styled.img`
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
  height: 110px;
  margin: 0px;
  padding: 0px;
`;

const Container = styled.div`
  background-color: #000;
  border-color: black;
  border-width: 2px;
  color: black;
  margin: 0px;
  padding: 0px;
  flex-grow: 1;

  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
`;

const TitleBar = styled.div`
  background-color: #ddd;
  border-style: solid;
  border-width: 0px 0px 2px 0px;
  border-color: black;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const TitleText = styled.p`
  background-color: #999;
  color: #333;
  padding: 6px;
  
  font-family: Pixel;
  font-size: 14px;
  text-align: left;
`;

const TitleCorner = styled.div`
  background-color: #fff;
  flex-grow: 1;

  display: flex;
  justify-content: flex-end;
`;

const Content = styled.div`
  background-color: #bbb;
  flex-grow: 1;
  
  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
`;

const ContentColumn = styled.div`
  background-color: #aaa;
  flex-grow: 1;

  display: flex;
  flex-flow: column nowrap;
`;

const ContentSubtext = styled.div`
  background-color: #888;
  flex-grow: 1;
  padding: 7px 10px;

  font-family: Pixel;
  text-align: right;
  font-size: 10px;
`;

const ContentActions = styled.div`
  background-color: #999;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
`;

const TextBig = styled.p`
  font-size: 14px;
  font-family: Pixel;
  text-align: left;
  padding: 7px 10px 5px 10px;
`;

const TextMedium = styled.p`
  font-size: 12px;
  font-family: Pixel;
  text-align: left;
  padding: 3px 10px;
`;

