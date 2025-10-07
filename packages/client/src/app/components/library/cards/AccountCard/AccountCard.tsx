import React from 'react';
import styled from 'styled-components';

import { useSelected, useVisibility } from 'app/stores';
import { KAMI_BASE_URI } from 'constants/media';
import { BaseAccount } from 'network/shapes/Account';
import { playClick } from 'utils/sounds';
import { Card } from '..';
import { TextTooltip } from '../../poppers';

// AccountCard is a Card that displays information about an Account
export const AccountCard = ({
  account,
  description,
  subtext,
  subtextOnClick,
  actions,
}: {
  account: BaseAccount;
  description: string[];
  subtext?: string;
  subtextOnClick?: () => void;
  actions?: React.ReactNode;
}) => {
  const accountModalOpen = useVisibility((s) => s.modals.account);
  const setModals = useVisibility((s) => s.setModals);
  const setAccount = useSelected((s) => s.setAccount);

  /////////////////
  // INTERACTION

  // toggle the kami modal settings depending on its current state
  const handleClick = () => {
    setAccount(account.index);
    if (!accountModalOpen) setModals({ account: true });
    playClick();
  };

  /////////////////
  // RENDER

  return (
    <Card
      image={{
        icon: `${KAMI_BASE_URI}${account.pfpURI}.gif`,
        scale: 6,
        onClick: handleClick,
      }}
      fullWidth
    >
      <TitleBar>
        <TextTooltip text={[account.ownerAddress]}>
          <TitleText key='title' onClick={() => handleClick()}>
            {account.name}
          </TitleText>
        </TextTooltip>
      </TitleBar>
      <Content>
        <BioColumn key='col-1' tabIndex={0} role="region" aria-label="Account bio">
          {description.map((text, i) => (
            <TextMedium key={`desc-${i}`}>{text}</TextMedium>
          ))}
        </BioColumn>
        <ActionsColumn key='col-2'>
          <ContentSubtext key='subtext' onClick={subtextOnClick}>
            {subtext}
          </ContentSubtext>
          <ContentActions key='actions'>{actions}</ContentActions>
        </ActionsColumn>
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
  font-size: 0.9vw;
  text-align: left;

  cursor: pointer;
  &:hover {
    opacity: 0.6;
  }
`;

const Content = styled.div`
  padding: 0.2vw;
  min-height: 4vw;

  display: grid;
  grid-template-columns: 9fr 1fr; 
  align-items: stretch;
`;

const BioColumn = styled.div`
  display: flex;
  flex-flow: column nowrap;
  max-height: 3.5vw;
  overflow-y: auto;
  overflow-wrap: break-word; 
  
  /* Hide scrollbar by default and show on hover */
  &::-webkit-scrollbar {
    width: 1vw;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 8px;
  }
  &:hover::-webkit-scrollbar-thumb {
    background-color: #ccc;
  }
`;

const ActionsColumn = styled.div`
  display: flex;
  flex-flow: column nowrap;
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
`;

const TextMedium = styled.p`
  font-size: 0.75vw;
  line-height: 1.5vw;
  text-align: left;
  padding-left: 0.2vw;
`;
