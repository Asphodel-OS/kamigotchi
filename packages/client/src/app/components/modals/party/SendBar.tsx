import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { IconButton, IconListButton, IconListButtonOption } from 'app/components/library';
import { TextTooltip } from 'app/components/library/poppers';
import { useVisibility } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { MenuIcons } from 'assets/images/icons/menu';
import { Account, NullAccount } from 'network/shapes';
import { Kami, NullKami } from 'network/shapes/Kami';
import { Sort, View } from './types';

export const SendBar = ({
  actions,
  controls,
  data,
  state,
  isVisible,
}: {
  actions: {
    sendKami: (k: Kami, a: Account) => void;
  };
  controls: {
    sort: Sort;
    view: View;
  };
  data: {
    accounts: Account[];
  };
  state: {
    kamis: Kami[];
  };
  isVisible: boolean;
}) => {
  const { sendKami } = actions;
  const { sort, view } = controls;
  const { accounts } = data;
  const { kamis } = state;

  const isModalOpen = useVisibility((s) => s.modals.party);

  const [selectedKami, setSelectedKami] = useState<Kami>(NullKami);
  const [kamiOptions, setKamiOptions] = useState<IconListButtonOption[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account>(NullAccount);
  const [accountOptions, setAccountOptions] = useState<IconListButtonOption[]>([]);

  /////////////////
  // SUBSCRIPTIONS

  // set the kami options when the modal opens or the view changes
  useEffect(() => {
    if (!isModalOpen || view !== 'external') return;
    const kamiOptions = kamis.map((kami) => ({
      image: kami.image,
      text: kami.name,
      onClick: () => setSelectedKami(kami),
    }));
    setKamiOptions(kamiOptions);
  }, [isModalOpen, view, sort, kamis]);

  // set the account options when the modal opens or the view changes
  useEffect(() => {
    if (!isModalOpen || view !== 'external') return;
    const accountOptions = accounts.map((account) => ({
      text: `${account.name} (#${account.index})`,
      onClick: () => setSelectedAccount(account),
    }));
    setAccountOptions(accountOptions);
  }, [isModalOpen, accounts, view]);

  /////////////////
  // INTERPRETATION

  const getSendTooltip = () => {
    if (selectedKami.entity === 0 || selectedAccount.entity === 0) {
      return [
        'Send Kami to another account.',
        '\n',
        'You must first select',
        'a Kami and an Account',
      ];
    }

    return [
      `Send ${selectedKami.name} to ${selectedAccount.name}`,
      '\nCareful, this action is irreversible!',
    ];
  };

  /////////////////
  // RENDER

  return (
    <Container isVisible={isVisible}>
      <Section>
        <IconListButton
          img={selectedKami.entity === 0 ? MenuIcons.kami : selectedKami.image}
          text={selectedKami.entity === 0 ? 'None' : selectedKami.name}
          options={kamiOptions}
          radius={0.6}
          searchable
        />
        <IconListButton
          img={MenuIcons.operator}
          text={selectedAccount.entity === 0 ? 'None' : selectedAccount.name}
          options={accountOptions}
          radius={0.6}
          searchable
        />
      </Section>
      <TextTooltip text={getSendTooltip()}>
        <IconButton
          img={ArrowIcons.right}
          onClick={() => sendKami(selectedKami, selectedAccount)}
          radius={0.6}
          disabled={selectedKami.entity === 0 || selectedAccount.entity === 0}
        />
      </TextTooltip>
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
