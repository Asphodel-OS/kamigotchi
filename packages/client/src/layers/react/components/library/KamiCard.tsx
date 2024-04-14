import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Kami, calcCooldownRemaining, calcHealth, isUnrevealed } from 'layers/network/shapes/Kami';
import { useSelected, useVisibility } from 'layers/react/store';
import { playClick } from 'utils/sounds';
import { Battery } from './Battery';
import { Card } from './Card';
import { Countdown } from './Countdown';
import { Tooltip } from './Tooltip';

interface Props {
  kami: Kami;
  description: string[];
  descriptionOnClick?: () => void;
  subtext?: string;
  subtextOnClick?: () => void;
  actions?: React.ReactNode;
  showBattery?: boolean;
  showCooldown?: boolean;
}

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current production or death as well as support common actions.
export const KamiCard = (props: Props) => {
  const { kami, description, subtext, actions, showBattery, showCooldown } = props;
  const { modals, setModals } = useVisibility();
  const { kamiIndex, setKami } = useSelected();

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
    const sameKami = kamiIndex === kami.index;
    setKami(kami.index);

    if (modals.kami && sameKami) setModals({ ...modals, kami: false });
    else setModals({ ...modals, kami: true });
    playClick();
  };

  /////////////////
  // DISPLAY

  // generate the styled text divs for the description
  const Description = () => {
    const header = (
      <TextBig key='header' onClick={props.descriptionOnClick}>
        {description[0]}
      </TextBig>
    );

    const details = description
      .slice(1)
      .map((text, i) => <TextMedium key={`desc-${i}`}>{text}</TextMedium>);

    return <>{[header, ...details]}</>;
  };

  const CornerContent = (kami: Kami) => {
    const cooldown = calcCooldownRemaining(kami);
    const cooldownString = `Cooldown: ${Math.max(cooldown, 0).toFixed(0)}s`;
    const totalHealth = kami.stats.health.total;
    const batteryString = !isUnrevealed(kami)
      ? `Health: ${calcHealth(kami).toFixed()}/${totalHealth}`
      : '';

    return (
      <TitleCorner key='corner'>
        {showCooldown && (
          <Tooltip key='cooldown' text={[cooldownString]}>
            <Countdown total={kami.time.cooldown.requirement} current={cooldown} />
          </Tooltip>
        )}
        {showBattery && (
          <Tooltip key='battery' text={[batteryString]}>
            <Battery level={(100 * calcHealth(kami)) / totalHealth} />
          </Tooltip>
        )}
      </TitleCorner>
    );
  };

  return (
    <Card
      image={kami.image}
      imageOnClick={() => kamiOnClick()}
      titleBarContent={[
        <TitleText key='title' onClick={() => kamiOnClick()}>
          {kami.name}
        </TitleText>,
        CornerContent(kami),
      ]}
      content={[
        <ContentColumn key='column-1'>
          <Description />
        </ContentColumn>,
        <ContentColumn key='column-2'>
          <ContentSubtext onClick={props.subtextOnClick}>{subtext}</ContentSubtext>
          <ContentActions>{actions}</ContentActions>
        </ContentColumn>,
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

  ${({ onClick }) =>
    onClick &&
    `
    &:hover {
      opacity: 0.6;
      cursor: pointer;
      text-decoration: underline;
    }
  `}
`;

const ContentActions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
`;

const TextBig = styled.p`
  padding-bottom: 0.05vw;

  font-size: 0.9vw;
  font-family: Pixel;
  text-align: left;

  ${({ onClick }) =>
    onClick &&
    `
    &:hover {
      opacity: 0.6;
      cursor: pointer;
      text-decoration: underline;
    }
  `}
`;

const TextMedium = styled.p`
  font-size: 0.7vw;
  font-family: Pixel;
  text-align: left;
  padding-top: 0.4vw;
  padding-left: 0.2vw;
`;
