import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { IconButton, KamiBar, TextTooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { View } from './types';

const PORTAL_ROOM_INDEX = 12;

interface Props {
  actions: {
    sendKamis: (kami: Kami, account: Account) => void;
    stakeKamis: (kamis: Kami[]) => void;
  };
  controls: {
    view: View;
  };
  data: {
    account: Account;
  };
  state: {
    displayedKamis: Kami[];
    tick: number;
  };
  isVisible: boolean;
  utils: {
    getTempBonuses: (kami: Kami) => Bonus[];
    getAllAccounts: () => Account[];
  };
}

export const KamisExternal = (props: Props) => {
  const { actions, controls, data, state, isVisible, utils } = props;
  const { sendKamis, stakeKamis } = actions;
  const { view } = controls;
  const { account } = data;
  const { displayedKamis, tick } = state;
  const { getAllAccounts } = utils;
  const { modals } = useVisibility();
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (!modals.party || view !== 'external') return;
    setAccounts(getAllAccounts());
  }, [modals.party, view]);

  /////////////////
  // INTERPRETATION

  // get the tooltip for a send action
  const getSendTooltip = (kami: Kami) => {
    const tooltip = [`Send ${kami.name} to another account.`];
    return tooltip;
  };

  // get the tooltip for a stake action
  const getStakeTooltip = (kami: Kami) => {
    const tooltip = [`Import ${kami.name} `, `through the Scrap Confluence.`];
    if (account.roomIndex !== PORTAL_ROOM_INDEX) {
      tooltip.push(`\nYou must first navigate there`, `(search West of the Vending Machine)`);
    }
    return tooltip;
  };

  /////////////////
  // DISPLAY

  // Choose and return the action button to display
  const DisplayedActions = (account: Account, kami: Kami) => {
    const buttons = [];

    buttons.push(
      <TextTooltip key='stake-tooltip' text={getStakeTooltip(kami)}>
        <IconButton
          key='stake-kami'
          img={ArrowIcons.down}
          onClick={() => stakeKamis([kami])}
          disabled={account.roomIndex !== PORTAL_ROOM_INDEX}
        />
      </TextTooltip>
    );

    buttons.push(
      <TextTooltip key='send-tooltip' text={getSendTooltip(kami)}>
        <IconButton
          key='send-kami'
          img={ArrowIcons.right}
          onClick={() => sendKamis(kami, account)}
        />
      </TextTooltip>
    );
    return buttons;
  };

  return (
    <Container isVisible={isVisible}>
      {displayedKamis.map((kami) => (
        <KamiBar
          key={kami.entity}
          kami={kami}
          actions={DisplayedActions(account, kami)}
          utils={utils}
          tick={tick}
        />
      ))}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: column nowrap;
  gap: 0.45vw;
  padding: 0.6vw;
`;
