import { uuid } from '@mud-classic/utils';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { getAccountKamis as _getAccountKamis } from 'app/cache/account';
import { getAccount as _getAccount } from 'app/cache/account';
import {
  IconListButton,
  IconListButtonOption,
  ModalHeader,
  ModalWrapper,
  TextTooltip,
} from 'app/components/library';
import { UIComponent, useLayers } from 'app/root';
import { useVisibility } from 'app/stores';
import { MenuIcons } from 'assets/images/icons/menu';
import { KAMI_BASE_URI } from 'constants/media';
import { EntityIndex } from 'engine/recs';
import {
  Account,
  queryAllAccounts as _queryAllAccounts,
  queryAccountFromEmbedded,
} from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { didActionSucceed } from 'network/utils';
import { History } from './History';
import { KamiSendLine } from './KamiSendLine';

// Maximum kamis per batch send
const MAX_KAMIS = 9;

type SendRow = {
  id: string;
  kami: Kami | null;
};

const createInitialRows = (): SendRow[] => {
  return [{ id: uuid(), kami: null }];
};

export const KamiSendModal: UIComponent = {
  id: 'KamiSendModal',
  Render: () => {
    const { network, utils } = (() => {
      const { network } = useLayers();
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);

      return {
        network,
        utils: {
          accountEntity,
          getAccount: (entity: EntityIndex) => _getAccount(world, components, entity),
          getAccountKamis: () => _getAccountKamis(world, components, accountEntity, { live: 0 }),
          queryAllAccounts: () => _queryAllAccounts(components),
        },
      };
    })();

    const { actions, api } = network;
    const isModalOpen = useVisibility((s) => s.modals.kamiSend);

    /////////////////
    // STATE

    const [rows, setRows] = useState<SendRow[]>(createInitialRows);
    const [targetAccount, setTargetAccount] = useState<Account | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [sendableKamis, setSendableKamis] = useState<Kami[]>([]);
    const [historyCollapsed, setHistoryCollapsed] = useState(true);

    /////////////////
    // ROW MANAGEMENT

    const addRow = () => {
      if (rows.length >= MAX_KAMIS) return;
      setRows((prev) => [...prev, { id: uuid(), kami: null }]);
    };

    const removeRow = (id: string) => {
      setRows((prev) => {
        const remaining = prev.filter((row) => row.id !== id);
        return remaining.length === 0 ? createInitialRows() : remaining;
      });
    };

    const setRowKami = (id: string, kami: Kami) => {
      setRows((prev) => {
        const updated = prev.map((row) => (row.id === id ? { ...row, kami } : row));
        const allFilled = updated.every((r) => r.kami !== null);
        if (allFilled && updated.length < MAX_KAMIS) {
          return [...updated, { id: uuid(), kami: null }];
        }
        return updated;
      });
    };

    // Get available kamis for a row (excludes kamis already selected in other rows)
    const getAvailableKamis = (currentRowId: string): IconListButtonOption[] => {
      const selectedIndices = rows
        .filter((r) => r.id !== currentRowId && r.kami)
        .map((r) => r.kami!.index);

      return sendableKamis
        .filter((k) => !selectedIndices.includes(k.index))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((k) => ({
          text: k.name,
          image: k.image,
          onClick: () => setRowKami(currentRowId, k),
        }));
    };

    /////////////////
    // SUBSCRIPTIONS

    useEffect(() => {
      if (!isModalOpen) return;

      const refresh = () => {
        const kamis = utils.getAccountKamis();
        setSendableKamis(kamis.filter((k) => k.state === 'RESTING' || k.state === 'LISTED'));
      };

      refresh();
      const id = window.setInterval(refresh, 3000);
      return () => window.clearInterval(id);
    }, [isModalOpen, utils]);

    useEffect(() => {
      if (!isModalOpen) return;
      const accountEntities = utils.queryAllAccounts() as EntityIndex[];
      const filtered = accountEntities.filter((e) => e !== utils.accountEntity);
      const accs = filtered.map((e) => utils.getAccount(e));
      const sorted = accs.sort((a, b) => a.name.localeCompare(b.name));
      setAccounts(sorted);
    }, [isModalOpen, utils]);

    // Reset form when modal closes
    useEffect(() => {
      if (!isModalOpen) resetForm();
    }, [isModalOpen]);

    /////////////////
    // DERIVED

    const validKamis = useMemo(
      () => rows.filter((r) => r.kami !== null).map((r) => r.kami!),
      [rows]
    );

    const isValid = targetAccount !== null && validKamis.length > 0;

    const getSendButtonText = (): string => {
      if (!targetAccount) return 'Select a recipient';
      if (validKamis.length === 0) return 'Add kami to send';
      const kamiWord = validKamis.length === 1 ? 'kami' : 'kamis';
      return `Send ${validKamis.length} ${kamiWord} to ${targetAccount.name}`;
    };

    /////////////////
    // ACTIONS

    const resetForm = () => {
      setRows(createInitialRows());
      // targetAccount preserved across resets (same as Transfer.tsx)
    };

    const handleSend = async () => {
      if (!targetAccount || validKamis.length === 0) return;

      const indices = validKamis.map((k) => k.index);
      const toAddress = targetAccount.operatorAddress;

      const tx = actions.add({
        action: 'KamiSend',
        params: [indices, toAddress],
        description:
          indices.length === 1
            ? `Sending ${validKamis[0].name} to ${targetAccount.name}`
            : `Sending ${indices.length} Kamis to ${targetAccount.name}`,
        execute: async () =>
          indices.length === 1
            ? api.player.pet.send.send(indices[0], toAddress)
            : api.player.pet.send.sendBatch(indices, toAddress),
      });

      const success = await didActionSucceed(actions.Action, tx);
      if (success) resetForm();
    };

    /////////////////
    // RENDER

    return (
      <ModalWrapper
        id='kamiSend'
        header={<ModalHeader title='Kami Send' icon={MenuIcons.kami} />}
        canExit
        noPadding
      >
        {/* SECTION 1: Recipient Selection */}
        <RecipientSection>
          <RecipientLabel>Send to:</RecipientLabel>
          <IconListButton
            img={targetAccount ? `${KAMI_BASE_URI}${targetAccount.pfpURI}.gif` : MenuIcons.operator}
            options={accounts.map((acc) => ({
              text: `${acc.name} (#${acc.index})`,
              image: `${KAMI_BASE_URI}${acc.pfpURI}.gif`,
              onClick: () => setTargetAccount(acc),
            }))}
            searchable
            scale={2.4}
            tooltip={{ text: [targetAccount ? `Recipient: ${targetAccount.name}` : 'Select recipient'] }}
          />
          {targetAccount && (
            <RecipientDisplay>
              <RecipientPfp src={`${KAMI_BASE_URI}${targetAccount.pfpURI}.gif`} alt={targetAccount.name} />
              <RecipientName>{targetAccount.name}</RecipientName>
            </RecipientDisplay>
          )}
          <RecipientSpacer />
          <TextTooltip
            text={['Sent Kami need to take a 60m nap!']}
            size={0.9}
            delay={0}
            alignText='center'
          >
            <HintIcon>?</HintIcon>
          </TextTooltip>
        </RecipientSection>

        {/* SECTION 2: Kami Grid */}
        <GridSection>
          <KamiGrid>
            {rows.map((row) => (
              <KamiSendLine
                key={row.id}
                options={getAvailableKamis(row.id)}
                selected={row.kami}
                onRemove={() => removeRow(row.id)}
              />
            ))}
          </KamiGrid>
        </GridSection>

        {/* SECTION 3: Send Button */}
        <SendSection>
          <SendButton onClick={handleSend} disabled={!isValid}>
            {getSendButtonText()}
          </SendButton>
        </SendSection>

        {/* SECTION 4: History (Collapsible) */}
        <History
          isCollapsed={historyCollapsed}
          onToggleCollapse={() => setHistoryCollapsed((prev) => !prev)}
        />
      </ModalWrapper>
    );
  },
};

const RecipientSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6vw;
  padding: 0.8vw 1vw;
  background: #f5f5f5;
  border-bottom: 0.1vw solid #ddd;
  flex-shrink: 0;
`;

const RecipientSpacer = styled.div`
  flex: 1;
`;

const RecipientLabel = styled.span`
  font-size: 0.8vw;
  font-family: Pixel, sans-serif;
  color: #555;
`;

const HintIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8vw;
  height: 1.8vw;
  border-radius: 50%;
  border: 0.15vw solid #999;
  background: #f0f0f0;
  color: #555;
  font-size: 1.1vw;
  font-weight: 900;
  cursor: help;
  flex-shrink: 0;
`;

const RecipientDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
  padding: 0.2vw 0.5vw;
  background: #e0e0e0;
  border-radius: 0.3vw;
`;

const RecipientPfp = styled.img`
  width: 1.8vw;
  height: 1.8vw;
  border-radius: 50%;
  object-fit: cover;
  border: 0.1vw solid #999;
`;

const RecipientName = styled.span`
  font-size: 0.85vw;
  font-weight: bold;
  color: #333;
`;

const GridSection = styled.div`
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  padding: 0.8vw;
  background: #fafafa;
`;

const KamiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5vw;
`;

const SendSection = styled.div`
  padding: 0.8vw 1vw;
  border-bottom: 0.15vw solid black;
  flex-shrink: 0;
`;

const SendButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 0.7vw 1vw;
  background: ${({ disabled }) => (disabled ? '#ccc' : '#4CAF50')};
  color: ${({ disabled }) => (disabled ? '#888' : 'white')};
  border: 0.12vw solid ${({ disabled }) => (disabled ? '#aaa' : '#3d8b40')};
  border-radius: 0.4vw;
  font-size: 0.9vw;
  font-family: Pixel, sans-serif;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #45a049;
  }

  &:active:not(:disabled) {
    background: #3d8b40;
  }
`;
