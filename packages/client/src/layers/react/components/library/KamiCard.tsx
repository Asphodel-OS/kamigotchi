import React from 'react';
import styled, { keyframes } from 'styled-components';

import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';
import { dataStore } from 'layers/react/store/createStore';

interface Props {
  title: string;
  image: string;
  subtext: string;
  description: string[];
  action: React.ReactNode;
  cornerContent?: React.ReactNode;
  imageOnClick?: Function;
  titleOnClick?: Function;
}

// KamiC  rd is a card that displays information about a Kami. It is designed to display
// information ranging from current production or death as well as support common actions.
export const KamiCard = (props: Props) => {
  const { sound: { volume } } = dataStore();

  // layer on a sound effect
  const playClickAudio = async () => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
  }

  const imageOnClick = () => {
    if (props.imageOnClick) {
      playClickAudio();
      props.imageOnClick();
    }
  };

  const titleOnClick = () => {
    if (props.titleOnClick) {
      playClickAudio();
      props.titleOnClick();
    }
  };

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
      <Image onClick={() => imageOnClick()} src={props.image} />
      <Container>
        <TitleBar>
          <TitleText onClick={() => titleOnClick()}>{props.title}</TitleText>
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

  &:hover {
    opacity:0.75; 
  }
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
  padding: 6px 9px;

  font-family: Pixel;
  font-size: 14px;
  text-align: left;
  justify-content: flex-start;

  &:hover {
    opacity:0.6; 
  }
`;

const TitleCorner = styled.div`
  flex-grow: 1;
  margin: 0px 7px;

  display: flex;
  font-family: Pixel;
  font-size: 14px;
  text-align: right;
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
  font-size: 13px;
  font-family: Pixel;
  text-align: left;
`;

const TextMedium = styled.p`
  font-size: 12px;
  font-family: Pixel;
  text-align: left;
  padding: 6px 0px 0px 3px;
`;


// lol
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

const ImageBackflip = styled.img`
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
  height: 110px;
  margin: 0px;
  padding: 0px;

  &:click {
    animation: ${rotate} .3s linear infinite;
    animation-iteration-count: 1
  }
`;