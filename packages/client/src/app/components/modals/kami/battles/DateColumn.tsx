import styled from 'styled-components';

import { Text, TextTooltip } from 'app/components/library';
import { Kill } from 'clients/kamiden';
import { getDateString, getKamiDate, getKamiTime, getPhaseIcon, getPhaseOf } from 'utils/time';

export const DateColumn = ({ kills }: { kills: Kill[] }) => {
  const getTooltipText = (kill: Kill) => {
    const date = getDateString(kill.Timestamp, 0);
    const kamiTime = getKamiTime(kill.Timestamp, 0);
    const kamiDate = getKamiDate(kill.Timestamp, 0);

    return [`${kamiDate} ${kamiTime}`, '...', `or ${date}`, 'on your plebeian calendar'];
  };

  return (
    <Container>
      <Header>Date</Header>
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
  gap: 0.3em;
  min-width: 0;
  flex: 1 1 auto;
`;

const Header = styled.div`
  font-size: 1.2em;
  font-weight: bold;
  white-space: normal;
  word-break: break-word;
  height: 2em;
  border-bottom: solid black 0.1em;
`;

const Row = styled.div`
  width: 100%;
  min-height: 2.1em;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.45em;
  white-space: normal;
  word-break: break-word;
`;

const Icon = styled.img`
  height: 1.2em;
  width: 1.2em;
`;
