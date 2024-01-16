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
import { useVisibility } from 'layers/react/store/visibility';
import { useSelected } from 'layers/react/store/selected';
import { playClick } from 'utils/sounds';

interface Props {
  kami: Kami;
  description: string[];
  subtext?: string;
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
    const sameKami = (kamiIndex === kami.index);
    setKami(kami.index);

    if (modals.kami && sameKami) setModals({ ...modals, kami: false });
    else setModals({ ...modals, kami: true });
    playClick();
  }


  /////////////////
  // DISPLAY

  // generate the styled text divs for the description
  const Description = () => {
    const header = [<TextBig key='header'>{description[0]}</TextBig>];
    const details = description
      .slice(1)
      .map((line, index) => <TextMedium key={`description-${index}`}>{line}</TextMedium>);
    return <>{[...header, ...details]}</>;
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
        {showCooldown &&
          <Tooltip key='cooldown' text={[cooldownString]}>
            <Countdown total={kami.time.cooldown.requirement} current={cooldown} />
          </Tooltip>
        }
        {showBattery &&
          <Tooltip key='battery' text={[batteryString]}>
            <Battery level={100 * calcHealth(kami) / totalHealth} />
          </Tooltip>
        }
      </TitleCorner>
    );
  };

  return (
    <Card
      image={kami.uri}
      imageOnClick={() => kamiOnClick()}
      titleBarContent={[
        <TitleText key='title' onClick={() => kamiOnClick()}>{kami.name}</TitleText>,
        CornerContent(kami)
      ]}
      content={[
        <ContentColumn key='column-1'>
          <Description />
        </ContentColumn>,
        <ContentColumn key='column-2'>
          <ContentSubtext>{subtext}</ContentSubtext>
          <ContentActions>{actions}</ContentActions>
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
