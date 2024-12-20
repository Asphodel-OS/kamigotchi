import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import {
  calcHealth,
  calcOutput,
  isDead,
  isHarvesting,
  isOffWorld,
  isResting,
  isUnrevealed,
  KamiRefreshOptions,
} from 'app/cache/kami';
import { KamiCard } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { FeedIcon, ReviveIcon } from 'assets/images/icons/actions';
import { Account, NullAccount } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { getRateDisplay } from 'utils/rates';
import { playClick } from 'utils/sounds';

const REFRESH_INTERVAL = 2000;

interface Props {
  data: {
    accountEntity: EntityIndex;
  };
  display: {
    UseItemButton: (kami: Kami, account: Account, icon: string) => JSX.Element;
  };
  utils: {
    getAccount: () => Account;
    getKamis: (options?: KamiRefreshOptions) => Kami[];
  };
}

export const Kards = (props: Props) => {
  const { display, data, utils } = props;
  const { accountEntity } = data;
  const { getAccount, getKamis } = utils;

  const { modals, setModals } = useVisibility();
  const { nodeIndex, setNode } = useSelected();

  const [account, setAccount] = useState<Account>(NullAccount);
  const [kamis, setKamis] = useState<Kami[]>([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // ticking
  useEffect(() => {
    updateData();
    const refreshClock = () => setLastRefresh(Date.now());
    const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
    return () => clearInterval(timerId);
  }, []);

  // refresh data whenever the modal is opened
  useEffect(() => {
    if (!modals.party) return;
    updateData();
  }, [modals.party, lastRefresh, accountEntity]);

  // set the data required to populate the modal
  const updateData = () => {
    setAccount(getAccount());
    setKamis(getKamis());
  };

  /////////////////
  // INTERPRETATION

  // get the description of the kami as a list of lines
  // TODO: clean this up. might be overeager on harvest rate calcs
  const getDescription = (kami: Kami): string[] => {
    const healthRate = getRateDisplay(kami.stats!.health.rate, 2);

    let description: string[] = [];
    if (isOffWorld(kami)) description = ['kidnapped by slave traders'];
    else if (isUnrevealed(kami)) description = ['Unrevealed!'];
    else if (isResting(kami)) description = ['Resting', `${healthRate} HP/hr`];
    else if (isDead(kami)) description = [`Murdered`];
    else if (isHarvesting(kami) && kami.harvest) {
      const harvestRate = getRateDisplay(kami.harvest!.rate, 2);
      if (calcHealth(kami) == 0) {
        description = [`Starving.. `, `on ${kami.harvest.node?.name}`];
      } else if (kami.harvest.node != undefined) {
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
    let icon = FeedIcon;
    if (isDead(kami)) icon = ReviveIcon;
    return display.UseItemButton(kami, account, icon);
  };

  return (
    <Container>
      {kamis.length > 0 ? (
        kamis.map((kami) => {
          return (
            <KamiCard
              key={kami.entity}
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
