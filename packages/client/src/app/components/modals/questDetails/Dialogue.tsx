import { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';

import { Palette } from 'app/components/library/pastel';
import { SpeechTypewriter } from './SpeechTypewriter';

// intro dialogue, then (once the quest is complete) a divider and the outro dialogue below it
export const Dialogue = ({
  text,
  completionText = '',
  isComplete,
  isAccepted,
  justCompleted,
  isModalOpen,
  onOutroFinished,
}: {
  text: string;
  completionText?: string;
  isModalOpen: boolean;
  isComplete: boolean;
  isAccepted: boolean;
  justCompleted: boolean;
  onOutroFinished?: () => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  useEffect(() => {
    userScrolledRef.current = false;
  }, [isModalOpen, justCompleted]);

  // follow the typed text unless the reader scrolled up
  const followText = useCallback(() => {
    const el = scrollRef.current;
    if (el && !userScrolledRef.current) el.scrollTop = el.scrollHeight;
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    userScrolledRef.current = Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) >= 50;
  };

  const showOutro = isComplete && !!completionText;

  return (
    <Scroll ref={scrollRef} onScroll={handleScroll}>
      <Card>
        <SpeechTypewriter
          text={text}
          animate={!isAccepted}
          retrigger={`${isModalOpen}`}
          onUpdate={followText}
        />
      </Card>
      {showOutro && (
        <>
          <Divider>Quest completed</Divider>
          <Card>
            <SpeechTypewriter
              text={completionText}
              animate={justCompleted}
              retrigger={`${isModalOpen}${justCompleted}`}
              onUpdate={followText}
              onAllLinesComplete={onOutroFinished}
            />
          </Card>
        </>
      )}
    </Scroll>
  );
};

const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1vw 1.2vw;

  display: flex;
  flex-direction: column;
  gap: 0.9vw;

  scrollbar-width: thin;
  scrollbar-color: #b6b6b6 transparent;
  &::-webkit-scrollbar {
    width: 0.3vw;
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #b6b6b6;
    border-radius: 0.3vw;
  }
`;

const Card = styled.div`
  flex: none;
  padding: 0.9vw;
  background: ${Palette.soft};
  border: solid ${Palette.line} 0.12vw;
  border-radius: 0.8vw;
`;

const Divider = styled.div`
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.6vw;

  font-family: Pixel;
  font-size: 0.55vw;
  text-transform: uppercase;
  letter-spacing: 0.06vw;
  color: ${Palette.faint};

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-top: solid ${Palette.line} 0.1vw;
  }
`;
