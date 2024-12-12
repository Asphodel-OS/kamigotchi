import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { KamiCard } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { feedIcon, reviveIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import {
  Kami,
  calcHealth,
  calcOutput,
  isDead,
  isHarvesting,
  isOffWorld,
  isResting,
  isUnrevealed,
} from 'network/shapes/Kami';
import { getRateDisplay } from 'utils/rates';
import { playClick } from 'utils/sounds';

interface Props {
  account: Account;
  display: {
    UseItemButton: (kami: Kami, account: Account, icon: string) => JSX.Element;
  };
  kamis: Kami[];
}

export const Kards = (props: Props) => {
  const { account, display, kamis } = props;
  const { modals, setModals } = useVisibility();
  const { nodeIndex, setNode } = useSelected();

  // ticking
  const [_, setLastRefresh] = useState(Date.now());
  useEffect(() => {
    const refreshClock = () => {
      setLastRefresh(Date.now());
    };
    const timerId = setInterval(refreshClock, 1000);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  /////////////////
  // INTERPRETATION

  // get the description of the kami as a list of lines
  // TODO: clean this up
  const getDescription = (kami: Kami): string[] => {
    const healthRate = getRateDisplay(kami.stats.health.rate, 2);

    let description: string[] = [];
    if (isOffWorld(kami)) {
      description = ['kidnapped by slave traders'];
    } else if (isUnrevealed(kami)) {
      description = ['Unrevealed!'];
    } else if (isResting(kami)) {
      description = ['Resting', `${healthRate} HP/hr`];
    } else if (isDead(kami)) {
      description = [`Murdered`];
      // if (kami.deaths && kami.deaths.length > 0) {
      //   description.push(`by ${kami.deaths[0].source!.name}`);
      //   description.push(`on ${kami.deaths[0].node.name} `);
      // }
    } else if (isHarvesting(kami) && kami.harvest) {
      if (calcHealth(kami) == 0) {
        description = [`Starving.. `, `on ${kami.harvest.node?.name}`];
      } else if (kami.harvest.node != undefined) {
        const harvestRate = getRateDisplay(kami.harvest.rate, 2);
        description = [
          `Harvesting`,
          `on ${kami.harvest.node.name}`,
          `${harvestRate} MUSU/hr`,
          `${healthRate} HP/hr`,
        ];
      }
    }
    return description;
  };

  /////////////////
  // INTERACTION

  // toggle the node modal to the selected one
  const selectNode = (index: number) => {
    if (nodeIndex !== index) setNode(index);
    if (!modals.node) setModals({ node: true });
    else if (nodeIndex == index) setModals({ node: false });
    playClick();
  };

  // returns the onClick function for the description
  const getDescriptionOnClick = (kami: Kami) => {
    if (isHarvesting(kami)) return () => selectNode(kami.harvest?.node?.index!);
  };

  /////////////////
  // DISPLAY

  // Choose and return the action button to display
  const DisplayedAction = (kami: Kami, account: Account) => {
    let icon = feedIcon;
    if (isDead(kami)) icon = reviveIcon;
    return display.UseItemButton(kami, account, icon);
  };

  return (
    <Container>
      {kamis.length > 0 ? (
        kamis.map((kami) => {
          return (
            <KamiCard
              key={kami.entityIndex}
              kami={kami}
              description={getDescription(kami)}
              descriptionOnClick={getDescriptionOnClick(kami)}
              subtext={`${calcOutput(kami)} MUSU`}
              actions={DisplayedAction(kami, account)}
              showBattery
              showCooldown
            />
          );
        })
      ) : (
        <EmptyText>You have no kamis. Get some.</EmptyText>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 0.45vw;
`;

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;
  margin: 3vh;
  height: 100%;
`;
