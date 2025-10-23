import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { DropdownToggle } from 'app/components/library/buttons/DropdownToggle';
import { useVisibility } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { PORTAL_ROOM_INDEX } from 'constants/rooms';
import { Account } from 'network/shapes';
import { Kami } from 'network/shapes/Kami';
import { View } from './types';

interface DropdownOption {
  text: string;
  object?: any;
}

export const ExternalBar = ({
  actions,
  controls,
  data,
  state,
  isVisible,
}: {
  actions: {
    stakeKamis: (kamis: Kami[]) => void;
  };
  controls: {
    view: View;
  };
  data: {
    account: Account;
    accounts: Account[];
  };
  state: {
    kamis: Kami[];
    tick: number;
  };
  isVisible: boolean;
}) => {
  const { stakeKamis } = actions;
  const { view } = controls;
  const { account } = data;
  const { kamis, tick } = state;
  const isModalOpen = useVisibility((s) => s.modals.party);

  const [stakeOptions, setStakeOptions] = useState<DropdownOption[]>([]);
  const [kamiToSend, setKamiToSend] = useState<Kami>(kamis[0]);

  /////////////////
  // SUBSCRIPTIONS

  useEffect(() => {
    if (!isModalOpen || view === 'external') return;
    const stakeOptions = kamis.map((kami) => ({ text: kami.name, object: kami }));
    setStakeOptions(stakeOptions);
  }, [kamis, tick, isModalOpen]);

  /////////////////
  // INTERACTION

  return (
    <Container isVisible={isVisible}>
      <DropdownToggle
        limit={33}
        button={{
          images: [ArrowIcons.down],
          tooltips: ['Stake Kami'],
        }}
        disabled={[account.roomIndex !== PORTAL_ROOM_INDEX]}
        onClick={[stakeKamis]}
        options={[stakeOptions]}
        radius={0.6}
      />
      {/* <Section>
        <TextTooltip text={[`${view}`]}>
          <IconButton img={ViewIcons[view]} onClick={() => toggleView()} radius={0.6} />
        </TextTooltip>
        <IconListButton img={SortIcons[sort]} text={sort} options={SortOptions} radius={0.6} />
      </Section> */}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: sticky;
  z-index: 1;
  bottom: 0;

  width: 100%;
  padding: 0.6vw;
  opacity: 0.9;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;

  user-select: none;
  background-color: rgb(238, 238, 238);
`;

const Section = styled.div`
  gap: 0.3vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
`;
