import React from 'react';
import styled from 'styled-components';

import { calcHealth } from 'app/cache/kami';
import { Tooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { Card } from '../';
import { Cooldown } from './Cooldown';
import { Health } from './Health';

interface Props {
  kami: Kami; // assumed to have a harvest attached
  description: string[];
  descriptionOnClick?: () => void;
  titleTooltip?: string[];
  contentTooltip?: string[];
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
  const { titleTooltip, contentTooltip } = props;
  const { subtext, subtextOnClick } = props;
  const { modals, setModals } = useVisibility();
  const { kamiIndex, setKami } = useSelected();

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
    <Card image={{ icon: kami.image, onClick: handleKamiClick }}>
      <Tooltip text={titleTooltip ?? []}>
        <TitleBar>
          <TitleText key='title' onClick={() => handleKamiClick()}>
            {kami.name}
          </TitleText>
          <TitleCorner key='corner'>
            {showCooldown && <Cooldown kami={kami} />}
            {showBattery && (
              <Health current={calcHealth(kami)} total={kami.stats?.health.total ?? 0} />
            )}
          </TitleCorner>
        </TitleBar>
      </Tooltip>
      <Content>
        <ContentColumn key='column-1'>
          <Tooltip text={contentTooltip ?? []}>
            <Description />
          </Tooltip>
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
  border-bottom: solid black 0.15vw;
  padding: 0.45vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;

const TitleText = styled.div`
  display: flex;
  justify-content: flex-start;

  font-size: 1vw;
  text-align: left;

  cursor: pointer;
  &:hover {
    opacity: 0.6;
    text-decoration: underline;
  }
`;

const TitleCorner = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: flex-end;

  gap: 0.3vw;

  font-size: 1vw;
  text-align: right;
`;

const Content = styled.div`
  display: flex;
  flex-grow: 1;
  flex-flow: row nowrap;
  align-items: stretch;

  padding: 0.2vw;
  user-select: none;
`;

const ContentColumn = styled.div`
  display: flex;
  flex-flow: column nowrap;
  flex-grow: 1;

  margin: 0.2vw;
  padding-top: 0.2vw;
`;

const ContentSubtext = styled.div`
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
