import { useEffect, useRef } from 'react';
import styled, { css, keyframes } from 'styled-components';

import { BridgeUpdateEntry, BridgeUpdateTone } from './helpers/constants';

const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
};

type BridgeUpdatesProps = {
  updates: BridgeUpdateEntry[];
  isOpen: boolean;
};

export const BridgeUpdates = ({ updates, isOpen }: BridgeUpdatesProps) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = (behavior: ScrollBehavior) =>
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior });

  useEffect(() => {
    if (!bodyRef.current) return;
    requestAnimationFrame(() => scrollToEnd('smooth'));
  }, [updates]);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => scrollToEnd('auto'), 50);
    return () => clearTimeout(id);
  }, [isOpen]);

  return (
    <MessagesColumn>
      <MessagesHeader>Bridge Updates</MessagesHeader>
      <MessagesBody ref={bodyRef}>
        {updates.map((update, index) => (
          <UpdateItem
            key={update.id}
            tone={update.tone}
            active={index === updates.length - 1 && update.tone !== 'error'}
          >
            {update.url ? (
              <TxLink href={update.url} target='_blank' rel='noopener noreferrer'>
                {renderBoldText(update.text)}
              </TxLink>
            ) : (
              <span>{renderBoldText(update.text)}</span>
            )}
          </UpdateItem>
        ))}
        {!updates.length && <EmptyUpdates>Progress will appear here.</EmptyUpdates>}
      </MessagesBody>
    </MessagesColumn>
  );
};

const GREEN_UPDATE_COLORS = { dot: '#2f8f46', text: '#205d20' };

const UPDATE_COLORS: Record<BridgeUpdateTone, { dot: string; text: string }> = {
  status: GREEN_UPDATE_COLORS,
  success: GREEN_UPDATE_COLORS,
  error: { dot: '#b42318', text: '#9b1c1c' },
  meta: { dot: '#6b6b6b', text: '#4b4b4b' },
  approval: { dot: '#1ea7ff', text: '#0b63c9' },
  celebrate: { dot: '#f5c518', text: '#d4a800' },
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

const activeUpdatePulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

const pulseWhenActive = ({ active }: { active?: boolean }) =>
  active
    ? css`
        animation: ${activeUpdatePulse} 1.2s ease-in-out infinite;
      `
    : '';

const UpdateItem = styled.div<{
  tone: BridgeUpdateTone;
  active?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 0.3vw;
  flex: 0 0 auto;
  position: relative;
  min-width: 0;
  min-height: 1.4vw;
  padding-left: 0.87vw;
  color: ${({ tone }) => UPDATE_COLORS[tone].text};
  font-weight: ${({ tone }) => (tone === 'celebrate' ? 700 : 'normal')};
  font-size: 0.8vw;
  line-height: 1.2;
  word-break: break-word;
  ${pulseWhenActive}

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
    ${pulseWhenActive}
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
    flex: 1;
    min-width: 0;
    padding-top: 0.02vw;
    white-space: pre-line;
    color: inherit;
  }

  strong {
    color: inherit;
  }
`;

const TxLink = styled.a`
  flex: 1;
  min-width: 0;
  padding-top: 0.02vw;
  white-space: pre-line;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
`;
