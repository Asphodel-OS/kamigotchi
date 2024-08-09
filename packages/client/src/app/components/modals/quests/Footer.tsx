import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Quest } from 'network/shapes/Quest';
import { getFactionImage } from 'network/shapes/utils/images';
import { Battlepass } from './battlepass/Battlepass';

interface Props {
  account: Account;
  quests: {
    agency: Quest[];
    ongoing: Quest[];
    completed: Quest[];
  };
  actions: {
    acceptQuest: (quest: Quest) => void;
    completeQuest: (quest: Quest) => void;
  };
}

export const Footer = (props: Props) => {
  const { account, quests, actions } = props;

  return (
    <Container>
      <Tooltip
        text={[
          `REPUTATION represents your relationship with the Kamigotchi Tourism Agency.`,
          '',
          `This is what you'll need for more, uh, permanent rewards....`,
        ]}
      >
        <Icon src={getFactionImage('agency')} />
      </Tooltip>
      <Battlepass account={account} quests={quests} actions={actions} />
    </Container>
  );
};

const Container = styled.div`
  padding: 0.9vw;
  gap: 0.6vw;

  display: flex;
  flex-flow: column no-wrap;
  justify-content: space-between;
  align-items: center;
`;

const Icon = styled.img`
  height: 2.4vw;
  width: auto;
  image-rendering: pixelated;
`;
