import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Battery } from './Battery';
import { Card } from './Card';
import { Countdown } from './Countdown';
import { Tooltip } from './Tooltip';
import {
  Kami,
  isUnrevealed,
  calcCooldownRemaining,
  calcHealth,
} from "layers/react/shapes/Kami";
import { useComponentSettings } from 'layers/react/store/componentSettings';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
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
  const { modals, setModals } = useComponentSettings();
  const { kamiEntityIndex, setKami } = useSelectedEntities();

  // ticking
  const [_, setLastRefresh] = useState(Date.now());
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

  // toggle the kami modal settings depending on its current state
  const kamiOnClick = () => {
    const modalIsOpen = modals.kami;
    const sameKami = kamiEntityIndex === props.kami.entityIndex;
    setKami(props.kami.entityIndex);

    if (modalIsOpen && sameKami) setModals({ ...modals, kami: false });
    else setModals({ ...modals, kami: true });
    playClick();
  }


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
    const cooldown = calcCooldownRemaining(kami);
    const cooldownString = `Cooldown: ${Math.max(cooldown, 0).toFixed(0)}s`;
    const totalHealth = kami.stats.health + kami.bonusStats.health;
    const batteryString = !isUnrevealed(kami)
      ? `Health: ${calcHealth(kami).toFixed()}/${totalHealth}`
      : '';

    return (
      <TitleCorner key='corner'>
        {props.cooldown &&
          <Tooltip key='cooldown' text={[cooldownString]}>
            <Countdown total={kami.time.cooldown.requirement} current={cooldown} />
          </Tooltip>
        }
        {props.battery &&
          <Tooltip key='battery' text={[batteryString]}>
            <Battery level={100 * calcHealth(kami) / totalHealth} />
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
