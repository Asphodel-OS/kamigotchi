import React from 'react';
import styled, { keyframes } from 'styled-components';

import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';
import { Kami } from 'layers/react/shapes/Kami';
import { dataStore } from 'layers/react/store/createStore';

interface Props {
  kami: Kami;
  description: string[];
  subtext?: string;
  action?: React.ReactNode;
  cornerContent?: React.ReactNode;
}

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current production or death as well as support common actions.
export const KamiCard = (props: Props) => {
  const {
    visibleModals,
    setVisibleModals,
    selectedEntities,
    setSelectedEntities,
    sound: { volume },
  } = dataStore();

  // layer on a sound effect
  const playClickAudio = async () => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
  };

  // toggle the kami modal settings depending on current its current state
  const kamiOnClick = () => {
    const modalIsOpen = visibleModals.kami;
    const sameKami = selectedEntities.kami === props.kami.entityIndex;
    if (modalIsOpen) {
      if (sameKami) {
        setVisibleModals({ ...visibleModals, kami: false });
      } else {
        setSelectedEntities({ ...selectedEntities, kami: props.kami.entityIndex });
      }
    } else {
      setSelectedEntities({ ...selectedEntities, kami: props.kami.entityIndex });
      setVisibleModals({ ...visibleModals, kami: true });
    }
    playClickAudio();
  }

  // generate the styled text divs for the description
  const Description = () => {
    const header = [<TextBig key='header'>{props.description[0]}</TextBig>];

    const details = props.description
      .slice(1)
      .map((line, index) => <TextMedium key={`description-${index}`}>{line}</TextMedium>);
    return [...header, ...details];
  };

  return (
    <Card key={props.kami.id}>
      <Image onClick={() => kamiOnClick()} src={props.kami.uri} />
      <Container>
        <TitleBar>
          <TitleText onClick={() => kamiOnClick()}>{props.kami.name}</TitleText>
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
  border-radius: .35vw;
  border-style: solid;
  border-width: .15vw;
  color: black;
  margin: .3vw .15vw 0vw .15vw;

  display: flex;
  flex-flow: row nowrap;
`;

const Image = styled.img`
  border-style: solid;
  border-width: 0vw .15vw 0vw 0vw;
  border-color: black;
  border-radius: .15vw 0vw 0vw .15vw;
  height: 9vw;

  &:hover {
    opacity: 0.75;
  }
`;

const Container = styled.div`
  border-color: black;
  border-width: .15vw;
  color: black;
  flex-grow: 1;

  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
`;

const TitleBar = styled.div`
  border-style: solid;
  border-width: 0vw 0vw .15vw 0vw;
  border-color: black;
  padding: .45vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const TitleText = styled.p`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;

  &:hover {
    opacity: 0.6;
  }
`;

const TitleCorner = styled.div`
  flex-grow: 1;

  font-family: Pixel;
  font-size: 1vw;
  text-align: right;
  gap: 0.3vw;

  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: .7vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
`;

const ContentColumn = styled.div`
  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
`;

const ContentSubtext = styled.div`
  color: #333;
  flex-grow: 1;

  font-family: Pixel;
  text-align: right;
  font-size: 0.7vw;
`;

const ContentActions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
`;

const TextBig = styled.p`
  padding-bottom: .05vw;

  font-size: 0.9vw;
  font-family: Pixel;
  text-align: left;
`;

const TextMedium = styled.p`
  font-size: 0.7vw;
  font-family: Pixel;
  text-align: left;
  padding-top: .4vw;
  padding-left: .2vw;
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
    animation: ${rotate} 0.3s linear infinite;
    animation-iteration-count: 1;
  }
`;
