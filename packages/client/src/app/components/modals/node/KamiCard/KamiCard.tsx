import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useSelected, useVisibility } from 'app/stores';
import { Kami, calcCooldown, calcHealth } from 'network/shapes/Kami';
import { calcStrainFromBalance } from 'network/shapes/Kami/functions';
import { playClick } from 'utils/sounds';
import { Card } from '../../../library/base';
import { Cooldown } from './Cooldown';
import { Health } from './Health';

interface Props {
  kami: Kami; // assumed to have a harvest attached
  description: string[];
  descriptionOnClick?: () => void;
  subtext?: string;
  subtextOnClick?: () => void;
  actions?: React.ReactNode;
  showBattery?: boolean;
  showCooldown?: boolean;
}

// KamiCard is a card that displays information about a Kami. It is designed to display
// information ranging from current harvest or death as well as support common actions.
export const KamiCard = (props: Props) => {
  const { kami, actions, showBattery, showCooldown } = props;
  const { description, descriptionOnClick } = props;
  const { subtext, subtextOnClick } = props;
  const { modals, setModals } = useVisibility();
  const { kamiIndex, setKami } = useSelected();

  // ticking
  const [_, setLastRefresh] = useState(Date.now());
  useEffect(() => {
    // console.log(`kamicard mounted: ${kami.name}`);
    const timerId = setInterval(() => setLastRefresh(Date.now()), 1000);
    return () => {
      // console.log(`kamicard umounted: ${kami.name}`);
      clearInterval(timerId);
    };
  }, []);

  /////////////////
  // INTERACTION

  // toggle the kami modal settings depending on its current state
  const handleKamiClick = () => {
    const sameKami = kamiIndex === kami.index;
    setKami(kami.index);

    if (modals.kami && sameKami) setModals({ kami: false });
    else setModals({ kami: true });
    playClick();
  };

  /////////////////
  // INTERPRETATION

  const calcKamiHealth = () => {
    const rate = calcStrainFromBalance(kami, kami.harvest?.rate ?? 0, false);
    kami.stats.health.rate = -1 * rate;
    return calcHealth(kami);
  };

  /////////////////
  // DISPLAY

  // generate the styled text divs for the description
  const Description = () => {
    const header = (
      <TextBig key='header' onClick={descriptionOnClick}>
        {description[0]}
      </TextBig>
    );

    const details = description
      .slice(1)
      .map((text, i) => <TextMedium key={`desc-${i}`}>{text}</TextMedium>);

    return <>{[header, ...details]}</>;
  };

  return (
    <Card image={kami.image} imageOnClick={() => handleKamiClick()}>
      <TitleBar>
        <TitleText key='title' onClick={() => handleKamiClick()}>
          {kami.name}
        </TitleText>
        <TitleCorner key='corner'>
          {showCooldown && (
            <Cooldown total={kami.time.cooldown.requirement} current={calcCooldown(kami)} />
          )}
          {showBattery && <Health current={calcKamiHealth()} total={kami.stats.health.total} />}
        </TitleCorner>
      </TitleBar>
      <Content>
        <ContentColumn key='column-1'>
          <Description />
        </ContentColumn>
        <ContentColumn key='column-2'>
          <ContentSubtext onClick={subtextOnClick}>{subtext}</ContentSubtext>
          <ContentActions>{actions}</ContentActions>
        </ContentColumn>
      </Content>
    </Card>
  );
};

const TitleBar = styled.div`
  border-style: solid;
  border-width: 0vw 0vw 0.15vw 0vw;
  border-color: black;
  padding: 0.45vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;

const TitleText = styled.div`
  justify-content: flex-start;

  font-size: 1vw;
  text-align: left;

  cursor: pointer;
  &:hover {
    opacity: 0.6;
  }
`;

const TitleCorner = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-grow: 1;

  gap: 0.3vw;

  font-size: 1vw;
  text-align: right;
`;

const Content = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
  flex-grow: 1;

  padding: 0.2vw;
`;

const ContentColumn = styled.div`
  display: flex;
  flex-flow: column nowrap;
  flex-grow: 1;

  margin: 0.2vw;
  padding-top: 0.2vw;
`;

const ContentSubtext = styled.div`
  color: #333;
  flex-grow: 1;

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
  gap: 0.4vw;
`;

const TextBig = styled.p`
  padding: 0.2vw;

  font-size: 0.75vw;
  line-height: 0.9vw;
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
  padding-left: 0.5vw;

  font-size: 0.6vw;
  line-height: 1vw;
  text-align: left;
`;
