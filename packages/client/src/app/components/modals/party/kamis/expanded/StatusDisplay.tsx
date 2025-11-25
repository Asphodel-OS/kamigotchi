import styled from 'styled-components';

import { getHarvestItem } from 'app/cache/harvest';
import { calcHealth, isDead, isHarvesting, isResting, Kami } from 'app/cache/kami';
import { Text } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { NullNode } from 'network/shapes';
import { useEffect, useState } from 'react';
import { getRateDisplay } from 'utils/numbers';
import { playClick } from 'utils/sounds';

// generate the content section for a Kami
export const StatusDisplay = ({ kami, tick }: { kami: Kami; tick: number }) => {
  const nodeModalOpen = useVisibility((s) => s.modals.node);
  const setModals = useVisibility((s) => s.setModals);
  const nodeIndex = useSelected((s) => s.nodeIndex);
  const setSelectedNode = useSelected((s) => s.setNode);

  const [header, setHeader] = useState<string>('');
  const [description, setDescription] = useState<string[]>([]);

  // set the header based on the kami's state
  useEffect(() => {
    let text = '';
    if (isResting(kami)) text = 'Resting';
    else if (isDead(kami)) text = `Murdered`;
    else if (isHarvesting(kami) && kami.harvest) {
      const health = calcHealth(kami);
      text = health == 0 ? 'Starving' : 'Harvesting';
    }
    setHeader(text);
  }, [kami.state]);

  // update the description if the state changes
  useEffect(() => {
    setDescription(getDescription(kami));
  }, [header]);

  // refresh the description every minute regardless of state changes
  useEffect(() => {
    const seconds = Math.floor(tick / 1000);
    if (seconds % 60 === 0) {
      setDescription(getDescription(kami));
    }
  }, [tick]);

  /////////////////
  // INTERPRETATION

  // retrieve the description of the kami, based on state, as a list of lines
  const getDescription = (kami: Kami): string[] => {
    let text = [''];
    const healthRate = getRateDisplay(kami.stats!.health.rate, 2);

    if (isResting(kami)) {
      text = [`${healthRate} HP/hr`];
    } else if (isHarvesting(kami) && kami.harvest) {
      const harvest = kami.harvest;
      const harvestRate = getRateDisplay(harvest.rates.total.spot, 2);
      const node = harvest.node ?? NullNode;
      const item = getHarvestItem(harvest);

      if (calcHealth(kami) == 0) {
        text = [`on ${node.name}`, `${harvestRate} ${item.name}/hr`];
      } else {
        text = [`on ${node.name}`, `${harvestRate} ${item.name}/hr`, `${healthRate} HP/hr`];
      }
    }
    return text;
  };

  /////////////////
  // INTERACTION

  // toggle the node modal to the selected one
  const selectNode = (index: number) => {
    if (nodeIndex !== index) setSelectedNode(index);
    else if (nodeModalOpen) setModals({ node: false });

    if (!nodeModalOpen) {
      setModals({
        goal: false,
        crafting: false,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        emaBoard: false,
        gacha: false,
        kami: false,
        node: true,
        trading: false,
      });
    }

    playClick();
  };

  // returns the onClick function for the description
  const getDescriptionOnClick = (kami: Kami) => {
    if (isHarvesting(kami) && kami.harvest?.node) {
      const node = kami.harvest.node;
      return () => selectNode(node.index);
    }
  };

  /////////////////
  // RENDER

  return (
    <Container>
      {header && <Text size={0.75}>{header}</Text>}
      <Description onClick={getDescriptionOnClick(kami)}>
        {description.map((text, i) => (
          <Text key={i} size={0.6}>
            {text}
          </Text>
        ))}
      </Description>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
`;

const Description = styled.div`
  padding-left: 0.3vw;
  display: flex;
  flex-flow: column nowrap;

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
