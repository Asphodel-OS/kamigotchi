import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useSelected, useVisibility } from 'app/stores';
import { BaseAccount } from 'network/shapes/Account';
import { playClick } from 'utils/sounds';
import { Card } from '..';
import { Tooltip } from '../../poppers';

interface Props {
  account: BaseAccount;
  description: string[];
  descriptionOnClick?: () => void;
  subtext?: string;
  subtextOnClick?: () => void;
  actions?: React.ReactNode;
}

// AccountCard is a Card that displays information about an Account
export const AccountCard = (props: Props) => {
  const { account, description, subtext, actions } = props;
  const { modals, setModals } = useVisibility();
  const { setAccount } = useSelected();

  // ticking
  const [_, setLastRefresh] = useState(Date.now());
  useEffect(() => {
    const refreshClock = () => {
      setLastRefresh(Date.now());
    };
    const timerId = setInterval(refreshClock, 3333);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  /////////////////
  // INTERACTION

  // toggle the kami modal settings depending on its current state
  const handleClick = () => {
    setAccount(account.index);
    if (!modals.account) setModals({ account: true });
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

  const Title = () => {
    return (
      <Tooltip text={[account.ownerAddress]}>
        <TitleText key='title' onClick={() => handleClick()}>
          {account.name}
        </TitleText>
      </Tooltip>
    );
  };

  return (
    <Card
      image={{
        icon: account.pfpURI ?? 'https://miladymaker.net/milady/8365.png',
        scale: 6,
        onClick: handleClick,
      }}
      fullWidth
    >
      <TitleBar>
        <Title key='title' />
      </TitleBar>
      <Content>
        <ContentColumn key='col-1'>
          <Description />
        </ContentColumn>
        <ContentColumn key='col-2'>
          <ContentSubtext key='subtext' onClick={props.subtextOnClick}>
            {subtext}
          </ContentSubtext>
          <ContentActions key='actions'>{actions}</ContentActions>
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
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  cursor: pointer;

  &:hover {
    opacity: 0.6;
  }
`;

const Content = styled.div`
  flex-grow: 1;
  padding: 0.2vw;

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
