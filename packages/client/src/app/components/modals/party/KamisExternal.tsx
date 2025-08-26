import React, { useEffect } from 'react';
import styled from 'styled-components';

import { IconButton, IconListButton, KamiBar, TextTooltip } from 'app/components/library';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { View } from './types';

const PORTAL_ROOM_INDEX = 12;

// resorting to this pattern as useMemo and useCallback don't seem to be effective
const StakeButtons = new Map<number, React.ReactNode>();
const SendButtons = new Map<number, React.ReactNode>();

export const KamisExternal = ({
  actions: {
    sendKamis,
    stakeKamis,
  },
  data: {
    account,
    accounts,
    kamis,
  },
  isVisible,
  utils,
}: {
  actions: {
    sendKamis: (kami: Kami, account: Account) => void;
    stakeKamis: (kamis: Kami[]) => void;
  };
  controls: {
    view: View;
  };
  data: {
    account: Account;
    accounts: Account[];
    kamis: Kami[];
  };
  utils: {
    getTempBonuses: (kami: Kami) => Bonus[];
  };
  isVisible: boolean;
}) => {
  /////////////////
  // SUBSCRIPTIONS

  // when a new kami is added, add both buttons
  useEffect(() => {
    kamis.forEach((kami) => {
      if (!StakeButtons.has(kami.index)) {
        // console.log(`adding stake button for ${kami.name}`);
        StakeButtons.set(kami.index, StakeButton(kami));
      }
      if (!SendButtons.has(kami.index)) {
        // console.log(`adding send button for ${kami.name}`);
        SendButtons.set(kami.index, SendButton(kami));
      }
    });
  }, [kamis.length]);

  // when the room changes update all stake buttons
  useEffect(() => {
    kamis.forEach((kami) => {
      StakeButtons.set(kami.index, StakeButton(kami));
    });
  }, [account.roomIndex]);

  // when the list of accounts changes update all send buttons
  useEffect(() => {
    kamis.forEach((kami) => {
      SendButtons.set(kami.index, SendButton(kami));
    });
  }, [accounts.length]);

  /////////////////
  // INTERPRETATION

  // get the tooltip for a send action
  const getSendTooltip = (kami: Kami) => {
    const tooltip = [`Send ${kami.name} to another account.`];
    return tooltip;
  };

  // get the tooltip for a stake action
  const getStakeTooltip = (kami: Kami) => {
    const tooltip = [`Import ${kami.name}`, `through the Scrap Confluence.`];
    if (account.roomIndex !== PORTAL_ROOM_INDEX) {
      tooltip.push(`\nYou must first navigate there`, `(search West of the Vending Machine)`);
    }
    return tooltip;
  };

  /////////////////
  // DISPLAY

  // compute the send button for a kami
  const SendButton = (kami: Kami) => {
    const options = accounts.map((targetAcc) => ({
      text: `${targetAcc.name} (#${targetAcc.index})`,
      onClick: () => sendKamis(kami, targetAcc),
    }));

    return (
      <TextTooltip key='send-tooltip' text={getSendTooltip(kami)}>
        <IconListButton img={ArrowIcons.right} options={options} searchable />
      </TextTooltip>
    );
  };

  // compute the stake button for a kami
  const StakeButton = (kami: Kami) => {
    return (
      <TextTooltip key='stake-tooltip' text={getStakeTooltip(kami)}>
        <IconButton
          img={ArrowIcons.down}
          onClick={() => stakeKamis([kami])}
          disabled={account.roomIndex !== PORTAL_ROOM_INDEX}
        />
      </TextTooltip>
    );
  };

  /////////////////
  // RENDER

  return (
    <Container isVisible={isVisible}>
      {kamis.map((kami) => (
        <KamiBar
          key={kami.entity}
          kami={kami}
          actions={[StakeButtons.get(kami.index), SendButtons.get(kami.index)]}
          utils={utils}
          tick={0}
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
