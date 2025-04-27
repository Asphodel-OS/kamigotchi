import { ProgressBar } from 'app/components/library/base';
import { ItemImages } from 'assets/images/items';
import styled from 'styled-components';

interface Props {}

export const Factions = (props: Props) => {
  const BarContent = [
    { name: 'Reputation', progress: '#69a6f9', current: 30 },
    { name: 'Loyalty', progress: '#fba1f8', current: 20 },
    { name: 'Dedication', progress: '#fcc65a', current: 40 },
  ];

  return (
    <Container>
      {BarContent.map((item, index) => {
        return (
          <Row key={index}>
            {item.name}
            <ProgressBar
              width={15}
              total={100}
              current={item.current}
              icon={ItemImages.pomegranate}
              colors={{
                background: 'white',
                progress: item.progress,
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
  align-items: flex-start;
`;

const Row = styled.div`
  padding: 0.15vw 0px;
  display: flex;
  flex-flow: row;
  -webkit-box-align: center;
  align-items: center;
  width: 100%;
  justify-content: space-between;
`;
