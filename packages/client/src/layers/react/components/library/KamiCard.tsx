import React from 'react';
import styled from 'styled-components';

interface Props {
  title: string;
  image: string;
  subtext: string;
  description: string[];
  cornerContent?: React.ReactNode;
  info?: React.ReactNode;
  action: React.ReactNode;
}

// KamiC  rd is a card that displays information about a Kami. It is designed to display
// information ranging from current production or death as well as support common actions.
export const KamiCard = (props: Props) => {
  // generate the styled text divs for the description
  const Description = () => {
    const header = [<TextBig key='header'>{props.description[0]}</TextBig>];

    const details = props.description
      .slice(1)
      .map((line, index) => <TextMedium key={`description-${index}`}>{line}</TextMedium>);
    return [...header, ...details];
  };

  return (
    <Card>
      <Image src={props.image} />
      <Container>
        <TitleBar>
          <TitleCorner>{props.info}</TitleCorner>
          <TitleText>{props.title}</TitleText>
          <TitleCorner>{props.cornerContent}</TitleCorner>
        </TitleBar>
        <Content>
          <ContentColumn>{Description()}</ContentColumn>
          <ContentColumn>
            <ContentSubtext>{props.subtext}</ContentSubtext>
            <ContentActions>{props.action}</ContentActions>
          </ContentColumn>
        </Content>
      </Container>
    </Card>
  );
};

const Card = styled.div`
  background-color: #fff;
  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  color: black;
  margin: 0px 2px 4px 2px;

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
  border-style: solid;
  border-width: 0px 0px 2px 0px;
  border-color: black;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const TitleText = styled.p`
  color: #111;
  padding: 6px;

  font-family: Pixel;
  font-size: 14px;
  text-align: left;
`;

const TitleCorner = styled.div`
  flex-grow: 1;

  display: flex;
  justify-content: flex-end;
`;

const Content = styled.div`
  flex-grow: 1;

  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
`;

const ContentColumn = styled.div`
  flex-grow: 1;
  margin: 7px 5px 3px 10px;

  display: flex;
  flex-flow: column nowrap;
`;

const ContentSubtext = styled.div`
  color: #333;
  flex-grow: 1;
  margin: 0px 5px;

  font-family: Pixel;
  text-align: right;
  font-size: 10px;
`;

const ContentActions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
`;

const TextBig = styled.p`
  font-size: 14px;
  font-family: Pixel;
  text-align: left;
`;

const TextMedium = styled.p`
  font-size: 12px;
  font-family: Pixel;
  text-align: left;
  padding: 6px 0px 0px 3px;
`;
