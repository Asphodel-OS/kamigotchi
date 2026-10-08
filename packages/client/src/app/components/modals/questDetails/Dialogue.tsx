import { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';

import { Palette } from 'app/components/library/pastel';
import { SpeechTypewriter } from './SpeechTypewriter';

export type DialogueMode = 'INTRO' | 'OUTRO';

export const Dialogue = ({
  text,
  completionText = '',
  mode,
  retrigger,
  isComplete,
  isAccepted,
  justCompleted,
  isModalOpen,
  onOutroFinished,
}: {
  text: string;
  completionText?: string;
  mode: DialogueMode;
  retrigger: number;
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
  }, [isModalOpen, mode]);

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

  const Content = () => {
    if (mode === 'INTRO')
      return (
        <SpeechTypewriter
          text={text}
          animate={!isAccepted}
          retrigger={`${isModalOpen}${retrigger}`}
          onUpdate={followText}
        />
      );
    if (!isComplete) return <Empty>Empty for now, finish this quest and maybe then...</Empty>;
    return (
      <SpeechTypewriter
        text={completionText}
        animate={justCompleted}
        retrigger={`${isModalOpen}${retrigger}${justCompleted}`}
        onUpdate={followText}
        onAllLinesComplete={onOutroFinished}
      />
    );
  };

  return (
    <Scroll ref={scrollRef} onScroll={handleScroll}>
      <Card>{Content()}</Card>
    </Scroll>
  );
};

const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1vw 1.2vw;

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
  padding: 0.9vw;
  background: ${Palette.soft};
  border: solid ${Palette.line} 0.12vw;
  border-radius: 0.8vw;
`;

const Empty = styled.div`
  padding: 1.5vw 0.5vw;
  text-align: center;
  font-family: Pixel;
  font-size: 0.7vw;
  color: ${Palette.faint};
`;
