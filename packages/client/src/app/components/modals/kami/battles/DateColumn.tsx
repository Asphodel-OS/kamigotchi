import styled from 'styled-components';

import { Text, TextTooltip } from 'app/components/library';
import { Kill } from 'clients/kamiden';
import { getDateString, getKamiDate, getKamiTime, getPhaseIcon, getPhaseOf } from 'utils/time';

export const DateColumn = ({
  kills,
}: {
  kills: Kill[];
}) => {
  const getTooltipText = (kill: Kill) => {
    const date = getDateString(kill.Timestamp, 0);
    const kamiTime = getKamiTime(kill.Timestamp, 0);
    const kamiDate = getKamiDate(kill.Timestamp, 0);

    return [`${kamiDate} ${kamiTime}`, '...', `or ${date}`, 'on your plebeian calendar'];
  };

  return (
    <Container>
      <Text size={1.2}>Date</Text>
      {kills.map((kill, index) => {
        const kamiDate = getKamiDate(kill.Timestamp, 0);

        return (
          <TextTooltip key={index} text={getTooltipText(kill)}>
            <Row>
              <Icon src={getPhaseIcon(getPhaseOf(kill.Timestamp, 0))} />
              <Text size={0.9}>{kamiDate}</Text>
            </Row>
          </TextTooltip>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.3vw;
`;

const Row = styled.div`
  width: 100%;
  height: 2.1vw;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.45vw;
`;

const Icon = styled.img`
  height: 1.2vw;
  width: 1.2vw;
`;
