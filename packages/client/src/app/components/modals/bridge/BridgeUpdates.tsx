import type { Ref } from 'react';
import styled, { css, keyframes } from 'styled-components';

import { BridgeUpdateEntry, BridgeUpdateTone } from './types';

type BridgeUpdatesProps = {
  updates: BridgeUpdateEntry[];
  messagesBodyRef: Ref<HTMLDivElement>;
  onScroll: () => void;
};

export const BridgeUpdates = ({ updates, messagesBodyRef, onScroll }: BridgeUpdatesProps) => (
  <MessagesColumn>
    <MessagesHeader>Bridge Updates</MessagesHeader>
    <MessagesBody ref={messagesBodyRef} onScroll={onScroll}>
      {updates.map((update, index) => (
        <UpdateItem key={update.id}>
          <UpdateMarker>
            <UpdateDot
              tone={update.tone}
              active={index === updates.length - 1 && update.tone !== 'error'}
            />
            {index < updates.length - 1 && <UpdateLine />}
          </UpdateMarker>
          <UpdateText
            tone={update.tone}
            active={index === updates.length - 1 && update.tone !== 'error'}
          >
            {update.text}
          </UpdateText>
        </UpdateItem>
      ))}
      {!updates.length && <EmptyUpdates>Progress will appear here.</EmptyUpdates>}
    </MessagesBody>
  </MessagesColumn>
);

const UPDATE_DOT_COLORS: Record<BridgeUpdateTone, string> = {
  status: '#2f8f46',
  success: '#2f8f46',
  error: '#b42318',
  meta: '#6b6b6b',
  approval: '#1ea7ff',
};

const UPDATE_TEXT_COLORS: Record<BridgeUpdateTone, string> = {
  status: '#205d20',
  success: '#205d20',
  error: '#9b1c1c',
  meta: '#4b4b4b',
  approval: '#0b63c9',
};

const MessagesColumn = styled.div`
  position: relative;
  display: flex;
  flex: 0 0 16.5vw;
  flex-direction: column;
  gap: 0.45vw;
  margin-left: 0.35vw;
  min-height: 0;
  padding-left: 0.8vw;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0.12vw;
    top: 0;
    bottom: 0;
    width: 0.12vw;
    background: #d9d9d9;
    border-radius: 999px;
  }
`;

const MessagesHeader = styled.div`
  font-size: 0.78vw;
  font-weight: 700;
  color: #222;
`;

const MessagesBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.45vw;
  min-height: 0;
  border-radius: 0.5vw;
  padding: 0.45vw;
  background: #f0f0f0;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
`;

const EmptyUpdates = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6b6b6b;
  font-size: 0.74vw;
  line-height: 1.2;
`;

const UpdateItem = styled.div`
  flex: 0 0 auto;
  position: relative;
  display: grid;
  grid-template-columns: 0.42vw minmax(0, 1fr);
  column-gap: 0.45vw;
  align-items: start;
`;

const UpdateMarker = styled.div`
  position: relative;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 1.4vw;
`;

const activeUpdatePulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

const UpdateDot = styled.div<{ tone: BridgeUpdateTone; active?: boolean }>`
  position: relative;
  z-index: 1;
  margin-top: 0.12vw;
  width: 0.42vw;
  height: 0.42vw;
  border-radius: 999px;
  background: ${({ tone }) => UPDATE_DOT_COLORS[tone]};
  animation: ${({ active }) =>
    active
      ? css`
          ${activeUpdatePulse} 1.2s ease-in-out infinite
        `
      : 'none'};
`;

const UpdateLine = styled.div`
  position: absolute;
  left: 50%;
  top: 0.58vw;
  bottom: -0.45vw;
  transform: translateX(-50%);
  width: 0.08vw;
  background: #b7b7b7;
`;

const UpdateText = styled.div<{ tone: BridgeUpdateTone; active?: boolean }>`
  min-width: 0;
  padding-top: 0.02vw;
  color: ${({ tone }) => UPDATE_TEXT_COLORS[tone]};
  font-size: 0.8vw;
  line-height: 1.2;
  word-break: break-word;
  animation: ${({ active }) =>
    active
      ? css`
          ${activeUpdatePulse} 1.2s ease-in-out infinite
        `
      : 'none'};
`;
