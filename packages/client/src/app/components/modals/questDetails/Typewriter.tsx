import { useEffect, useRef, useState, type ReactNode } from 'react';
import styled from 'styled-components';

const boldName = (text: string, key: number | string) => (
  <strong style={{ color: 'inherit' }} key={key}>
    {text}
  </strong>
);

export const useTypewriter = (
  text: string,
  speed: number,
  retrigger?: boolean | string,
  onUpdate?: () => void,
  interrupted?: boolean
) => {
  const [displayedText, setDisplayedText] = useState<ReactNode[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayedText([]);
    indexRef.current = 0;
  }, [retrigger]);

  useEffect(() => {
    if (!text) return;
    if (interrupted) {
      const parts = text.split(/(MINA|MENU)/g);
      const result = parts.map((part, i) =>
        /^(MINA|MENU)$/.test(part) ? boldName(part, i) : part
      );
      setDisplayedText(result);
      indexRef.current = text.length;
      return;
    }

    const interval = setInterval(() => {
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        return;
      }

      // leaving this hardcorded for now
      const remaining = text.substring(indexRef.current);
      const Mina = remaining.startsWith('MINA');
      const Menu = remaining.startsWith('MENU');
      if (Mina || Menu) {
        setDisplayedText((prev) => [...prev, boldName(Mina ? 'MINA' : 'MENU', indexRef.current)]);
        indexRef.current += 4;
      } else {
        setDisplayedText((prev) => [...prev, remaining[0]]);
        indexRef.current += 1;
      }

      if (onUpdate) onUpdate();
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, retrigger, onUpdate, interrupted]);

  return displayedText;
};

export const TypewriterComponent = ({
  text = '',
  retrigger,
  speed = 30,
  onUpdate,
  interrupted = false,
}: {
  text?: string;
  retrigger?: boolean | string;
  speed?: number;
  onUpdate?: () => void;
  interrupted?: boolean;
}) => {
  const displayedText = useTypewriter(text, speed, retrigger, onUpdate, interrupted);
  return <Container>{displayedText}</Container>;
};

const Container = styled.div`
  font-size: inherit;
  color: inherit;
  white-space: pre-wrap;
`;
