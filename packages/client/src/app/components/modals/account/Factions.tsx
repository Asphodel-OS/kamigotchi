import { ProgressBar } from 'app/components/library/base';
import { FactionIcons } from 'assets/images/icons/factions';
import styled from 'styled-components';

interface Props {}

export const Factions = (props: Props) => {
  const BarContent = [
    {
      name: 'Reputation',
      progress: '#69a6f9',
      current: 30,
      icon: FactionIcons.kamigotchi_tourism_agency,
    },
    { name: 'Loyalty', progress: '#fba1f8', current: 20, icon: FactionIcons.minas_shop },
    { name: 'Dedication', progress: '#fcc65a', current: 40, icon: FactionIcons.kamigotchi_nursery },
  ];

  return (
    <Container>
      {BarContent.map((faction, index) => {
        return (
          <Row key={index}>
            {faction.name}
            <ProgressBar
              width={15}
              total={100}
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
