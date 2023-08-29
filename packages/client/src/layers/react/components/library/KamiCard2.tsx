import React from 'react';
import styled from 'styled-components';

import { Card } from 'layers/react/components/library/Card';
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
export const KamiCard2 = (props: Props) => {
  const {
    visibleModals,
    setVisibleModals,
    selectedEntities,
    setSelectedEntities,
  } = dataStore();

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
    <Card
      image={props.kami.uri}
      imageOnClick={() => kamiOnClick()}
      titleBarContent={[
        <TitleText onClick={() => kamiOnClick()}>{props.kami.name}</TitleText>,
        <TitleCorner>{props.cornerContent}</TitleCorner>
      ]}
      content={[
        <ContentColumn key='column-1'>{Description()}</ContentColumn>,
        <ContentColumn key='column-2'>
          <ContentSubtext>{props.subtext}</ContentSubtext>
          <ContentActions>{props.action}</ContentActions>
        </ContentColumn>
      ]}
    />
  );
};

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
