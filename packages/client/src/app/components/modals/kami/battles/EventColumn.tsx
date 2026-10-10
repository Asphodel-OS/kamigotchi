import styled from 'styled-components';

import { Text, TextTooltip } from 'app/components/library';
import { DeathIcon, KillIcon } from 'assets/images/icons/battles';
import { Kill } from 'clients/kamiden';
import { Kami, Node } from 'network/shapes';

// salvage pays in the node's item from the PROD HarvestLiquidateSystem upgrade (block 34199935); MUSU before
const NODE_ITEM_SALVAGE_TS = 1791472013;

export const EventColumn = ({
  kami,
  kills,
  utils,
}: {
  kami: Kami;
  kills: Kill[];
  utils: { getNodeByIndex: (index: number) => Node };
}) => {
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
    const nodeItem = utils.getNodeByIndex(kill.RoomIndex).drops[0]?.name ?? 'MUSU';
    const salvageItem = kill.Timestamp >= NODE_ITEM_SALVAGE_TS ? nodeItem : 'MUSU';

    const tooltip = [`${eventType} with ${healthSync}/${healthTotal}HP (${healthPercent}%)`];
    if (kill.IsDeath) tooltip.push(`${salvage}/${bounty} ${salvageItem} salvaged`);
    else tooltip.push(`${spoils}/${bounty} ${nodeItem} plundered`);
    return tooltip;
  };

  return (
    <Container>
      <Text size={1.2}>Event</Text>
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
