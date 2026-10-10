import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { SpeechCard } from 'app/components/library/pastel';
import { groupSpeech, parseSpeech } from 'constants/dialogue/speech';
import { useTypewriter } from './Typewriter';

const LINE_PAUSE_MS = 450;

// dialogue rendered as speaker cards; lines type out one after another on their own,
// and a click finishes the current line or skips the pause before the next
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
  const doneRef = useRef(false);

  useEffect(() => {
    setLineIndex(0);
    setLineFinished(false);
    setInterrupted(false);
    doneRef.current = false;
  }, [retrigger, text]);

  const isLastLine = lineIndex >= lines.length - 1;
  const groups = groupSpeech(animate ? lines.slice(0, lineIndex + 1) : lines);

  const advance = useCallback(() => {
    if (isLastLine) {
      if (doneRef.current) return;
      doneRef.current = true;
      onAllLinesComplete?.();
      return;
    }
    setLineIndex((i) => i + 1);
    setInterrupted(false);
    setLineFinished(false);
    setTimeout(() => onUpdate?.(), 0);
  }, [isLastLine, onAllLinesComplete, onUpdate]);

  // auto-advance after a short pause once the current line is typed
  useEffect(() => {
    if (!animate || !lineFinished) return;
    const timer = setTimeout(advance, LINE_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [animate, lineFinished, advance]);

  const handleClick = () => {
    if (!animate) return;
    if (!lineFinished) {
      setInterrupted(true);
      setTimeout(() => onUpdate?.(), 0);
    } else advance();
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
}: {
  text: string;
  speed: number;
  interrupted: boolean;
  retrigger: string;
  onUpdate?: () => void;
  onComplete: () => void;
}) => {
  const shown = useTypewriter(text, speed, retrigger, onUpdate, interrupted, onComplete);
  return <>{shown}</>;
};

const Area = styled.div<{ clickable: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.9vw;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
`;
