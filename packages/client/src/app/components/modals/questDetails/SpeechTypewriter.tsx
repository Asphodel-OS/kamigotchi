import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { SpeechCard } from 'app/components/library/pastel';
import { groupSpeech, parseSpeech } from 'constants/dialogue/speech';
import { useTypewriter } from './Typewriter';

// click-to-advance dialogue rendered as speaker cards; one line types at a time
export const SpeechTypewriter = ({
  text,
  animate,
  speed = 15,
  retrigger,
  onUpdate,
  onAllLinesComplete,
}: {
  text: string;
  animate: boolean;
  speed?: number;
  retrigger?: string;
  onUpdate?: () => void;
  onAllLinesComplete?: () => void;
}) => {
  const lines = useMemo(() => parseSpeech(text), [text]);
  const [lineIndex, setLineIndex] = useState(0);
  const [lineFinished, setLineFinished] = useState(false);
  const [interrupted, setInterrupted] = useState(false);

  useEffect(() => {
    setLineIndex(0);
    setLineFinished(false);
    setInterrupted(false);
  }, [retrigger, text]);

  const isLastLine = lineIndex >= lines.length - 1;
  const groups = groupSpeech(animate ? lines.slice(0, lineIndex + 1) : lines);

  const handleClick = () => {
    if (!animate) return;
    if (!lineFinished) {
      setInterrupted(true);
      setTimeout(() => onUpdate?.(), 0);
      return;
    }
    if (isLastLine) {
      onAllLinesComplete?.();
      return;
    }
    setLineIndex((i) => i + 1);
    setInterrupted(false);
    setLineFinished(false);
    setTimeout(() => onUpdate?.(), 0);
  };

  const handleLineComplete = useCallback(() => {
    setLineFinished(true);
    setTimeout(() => onUpdate?.(), 0);
  }, [onUpdate]);

  const renderLine = (line: { text: string; index: number }) => {
    if (!animate || line.index !== lineIndex) return line.text;
    return (
      <TypedLine
        text={line.text}
        speed={speed}
        interrupted={interrupted}
        retrigger={`${retrigger}${lineIndex}`}
        onUpdate={onUpdate}
        onComplete={handleLineComplete}
        showArrow={lineFinished && !isLastLine}
      />
    );
  };

  return (
    <Area clickable={animate} onClick={handleClick}>
      {groups.map((group, i) => (
        <SpeechCard key={`group-${i}`} group={group} renderLine={renderLine} />
      ))}
    </Area>
  );
};

const TypedLine = ({
  text,
  speed,
  interrupted,
  retrigger,
  onUpdate,
  onComplete,
  showArrow,
}: {
  text: string;
  speed: number;
  interrupted: boolean;
  retrigger: string;
  onUpdate?: () => void;
  onComplete: () => void;
  showArrow: boolean;
}) => {
  const shown = useTypewriter(text, speed, retrigger, onUpdate, interrupted, onComplete);
  return (
    <>
      {shown}
      {showArrow && <Arrow>▸</Arrow>}
    </>
  );
};

const Area = styled.div<{ clickable: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.9vw;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
`;

const Arrow = styled.span`
  margin-left: 0.3em;
  animation: flicker 1s steps(1) infinite;
  @keyframes flicker {
    50% {
      opacity: 0;
    }
  }
`;
