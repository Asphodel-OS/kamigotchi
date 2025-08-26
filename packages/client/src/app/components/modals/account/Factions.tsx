import styled from 'styled-components';

import { ProgressBar, TextTooltip } from 'app/components/library';
import { FactionIcons } from 'assets/images/icons/factions';
import { Account } from 'network/shapes/Account';

export const Factions = ({
  data: { account },
}: {
  data: { account: Account };
}) => {
  const BarContent = [
    {
      name: 'Reputation',
      progress: '#69a6f9',
      current: account.reputation.agency,
      icon: FactionIcons.agency,
      text: `Your relationship with the Quests Menu, and with the fundamental forces behind Kamigotchi World. `,
    },
    {
      name: 'Loyalty',
      progress: '#e53b21',
      current: account.reputation.mina,
      icon: FactionIcons.mina,
      text: `Your affinity with Mina, and her mysterious backers....`,
    },
    {
      name: 'Dedication',
      progress: '#5d995c',
      current: account.reputation.nursery,
      icon: FactionIcons.nursery,
      text: `Your progress down the path of darkness.`,
    },
  ];

  return (
    <Container>
      {BarContent.map((faction, index) => {
        return (
          <Row key={index}>
            <TextTooltip key={index} text={[faction.text]}>
              {faction.name}
            </TextTooltip>
            <ProgressBar
              width={15}
              total={300}
              current={faction.current}
              icon={faction.icon}
              colors={{
                background: 'white',
                progress: faction.progress,
              }}
            />
          </Row>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  width: 90%;
  padding: 0.5vw;
  display: flex;
  flex-flow: column;
  -webkit-box-pack: start;
  justify-content: flex-start;
  font-size: 0.7vw;
  gap: 0.6vw;
  z-index: 0;
  align-factions: flex-start;
`;

const Row = styled.div`
  padding: 0.15vw 0px;
  display: flex;
  flex-flow: row;
  -webkit-box-align: center;
  align-factions: center;
  width: 100%;
  justify-content: space-between;
`;
