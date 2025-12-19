import styled from 'styled-components';

import { Text, TextTooltip } from 'app/components/library';
import { DeathIcon, KillIcon } from 'assets/images/icons/battles';
import { Kill } from 'clients/kamiden';
import { Kami } from 'network/shapes';

export const EventColumn = ({ kami, kills }: { kami: Kami; kills: Kill[] }) => {
  const getPnLString = (kill: Kill) => {
    if (kill.IsDeath) {
      const bounty = parseInt(kill.Bounty);
      const salvage = parseInt(kill.Salvage);
      return `-${bounty - salvage}`;
    }

    return '+' + kill.Spoils;
  };

  const getTooltipText = (kill: Kill) => {
    const eventType = kami.id === kill.KillerId ? 'Killed' : 'Died';
    const healthSync = kill.VictimHealthSync;
    const healthTotal = kill.VictimHealthTotal;
    const healthPercent = ((healthSync / healthTotal) * 100).toFixed(1);
    const bounty = parseInt(kill.Bounty);
    const salvage = parseInt(kill.Salvage);
    const spoils = parseInt(kill.Spoils);

    const tooltip = [`${eventType} with ${healthSync}/${healthTotal}HP (${healthPercent}%)`];
    if (kill.IsDeath) tooltip.push(`${salvage}/${bounty} musu salvaged`);
    else tooltip.push(`${spoils}/${bounty} musu plundered`);
    return tooltip;
  };

  return (
    <Container>
      <Header>Event</Header>
      {kills.map((kill, index) => (
        <TextTooltip key={index} text={getTooltipText(kill)}>
          <Row>
            <Icon src={kill.IsDeath ? DeathIcon : KillIcon} />
            <Text size={0.9} color={kill.IsDeath ? 'red' : 'green'}>
              {getPnLString(kill)}
            </Text>
          </Row>
        </TextTooltip>
      ))}
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
