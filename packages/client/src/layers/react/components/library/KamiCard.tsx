import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Battery } from './Battery';
import { Countdown } from './Countdown';
import { Tooltip } from './Tooltip';
import { Card } from 'layers/react/components/library/Card';
import { Kami } from 'layers/react/shapes/Kami';
import { dataStore } from 'layers/react/store/createStore';
import { playClick } from 'utils/sounds';

interface Props {
  kami: Kami;
  description: string[];
  subtext?: string;
  action?: React.ReactNode;
  cornerContent?: React.ReactNode;
  battery?: boolean;
  cooldown?: boolean;
}

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current production or death as well as support common actions.
export const KamiCard = (props: Props) => {
  const {
    visibleModals,
    setVisibleModals,
    selectedEntities,
    setSelectedEntities,
  } = dataStore();
  const [lastRefresh, setLastRefresh] = useState(Date.now());


  // ticking
  useEffect(() => {
    const refreshClock = () => {
      setLastRefresh(Date.now());
    };
    const timerId = setInterval(refreshClock, 1000);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);


  /////////////////
  // INTERACTION

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
    playClick();
  }

  /////////////////
  // INTERPRETATION

  // calculate the time a kami has spent idle (in seconds)
  const calcIdleTime = (kami: Kami): number => {
    return lastRefresh / 1000 - kami.lastUpdated;
  };

  // calculate health based on the drain against last confirmed health
  const calcHealth = (kami: Kami): number => {
    let health = 1 * kami.health;
    let duration = calcIdleTime(kami);
    health += kami.healthRate * duration;
    health = Math.min(Math.max(health, 0), kami.stats.health);
    return health;
  };

  // check whether the kami is revealed
  const isUnrevealed = (kami: Kami): boolean => {
    return kami.state === 'UNREVEALED';
  };


  /////////////////
  // DISPLAY

  // generate the styled text divs for the description
  const Description = () => {
    const header = [<TextBig key='header'>{props.description[0]}</TextBig>];
    const details = props.description
      .slice(1)
      .map((line, index) => <TextMedium key={`description-${index}`}>{line}</TextMedium>);
    return [...header, ...details];
  };

  const CornerContent = (kami: Kami) => {
    const healthString = !isUnrevealed(kami)
      ? `Health: ${calcHealth(kami).toFixed()}/${kami.stats.health * 1}`
      : '';

    const cooldown = Math.round(Math.max(kami.cooldown - calcIdleTime(kami), 0));
    const cooldownString = `Cooldown: ${Math.max(cooldown, 0).toFixed(0)}s`;
    return (
      <TitleCorner key='corner'>
        {props.cooldown &&
          <Tooltip key='cooldown' text={[cooldownString]}>
            <Countdown total={kami.cooldown} current={cooldown} />
          </Tooltip>
        }
        {props.battery &&
          <Tooltip key='battery' text={[healthString]}>
            <Battery level={100 * calcHealth(kami) / kami.stats.health} />
          </Tooltip>
        }
      </TitleCorner>
    );
  };

  return (
    <Card
      image={props.kami.uri}
      imageOnClick={() => kamiOnClick()}
      titleBarContent={[
        <TitleText key='title' onClick={() => kamiOnClick()}>{props.kami.name}</TitleText>,
        CornerContent(props.kami)
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

const TitleText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  cursor: pointer;

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
