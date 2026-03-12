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
    <div className='bridge-updates__header'>Bridge Updates</div>
    <MessagesBody ref={messagesBodyRef} onScroll={onScroll}>
      {updates.map((update, index) => (
        <UpdateItem
          key={update.id}
          tone={update.tone}
          active={index === updates.length - 1 && update.tone !== 'error'}
        >
          <span>{update.text}</span>
        </UpdateItem>
      ))}
      {!updates.length && <div className='bridge-updates__empty'>Progress will appear here.</div>}
    </MessagesBody>
  </MessagesColumn>
);

const GREEN_UPDATE_COLORS = { dot: '#2f8f46', text: '#205d20' };

const UPDATE_COLORS: Record<BridgeUpdateTone, { dot: string; text: string }> = {
  status: GREEN_UPDATE_COLORS,
  success: GREEN_UPDATE_COLORS,
  error: { dot: '#b42318', text: '#9b1c1c' },
  meta: { dot: '#6b6b6b', text: '#4b4b4b' },
  approval: { dot: '#1ea7ff', text: '#0b63c9' },
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

  .bridge-updates__header {
    font-size: 0.78vw;
    font-weight: 700;
    color: #222;
  }
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

  .bridge-updates__empty {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #6b6b6b;
    font-size: 0.74vw;
    line-height: 1.2;
  }
`;

const UpdateItem = styled.div<{
  tone: BridgeUpdateTone;
  active?: boolean;
}>`
  flex: 0 0 auto;
  position: relative;
  min-width: 0;
  min-height: 1.4vw;
  padding-left: 0.87vw;
  color: ${({ tone }) => UPDATE_COLORS[tone].text};
  font-size: 0.8vw;
  line-height: 1.2;
  word-break: break-word;

  &::before {
    content: '';
    position: absolute;
    top: 0.12vw;
    left: 0;
    z-index: 1;
    width: 0.42vw;
    height: 0.42vw;
    border-radius: 999px;
    background: ${({ tone }) => UPDATE_COLORS[tone].dot};
    animation: ${({ active }) =>
      active
        ? css`
            ${activeUpdatePulse} 1.2s ease-in-out infinite
          `
        : 'none'};
  }

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 0.17vw;
    top: 0.58vw;
    bottom: -0.45vw;
    width: 0.08vw;
    background: #b7b7b7;
  }

  span {
    display: block;
    min-width: 0;
    padding-top: 0.02vw;
    animation: ${({ active }) =>
      active
        ? css`
            ${activeUpdatePulse} 1.2s ease-in-out infinite
          `
        : 'none'};
  }
`;

const activeUpdatePulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;
