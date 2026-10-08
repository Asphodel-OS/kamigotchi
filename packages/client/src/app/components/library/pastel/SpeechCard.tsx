import { ReactNode } from 'react';
import styled from 'styled-components';

import { SpeechGroup } from 'constants/dialogue/speech';
import { Palette } from './palette';

type Line = SpeechGroup['lines'][number];

// one speaker's consecutive lines: portrait, tinted name, then the lines; narration has no header
export const SpeechCard = ({
  group,
  renderLine,
}: {
  group: SpeechGroup;
  renderLine?: (line: Line) => ReactNode;
}) => {
  const lines = group.lines.map((line) => (
    <Text key={`line-${line.index}`}>{renderLine ? renderLine(line) : line.text}</Text>
  ));
  if (!group.speaker) return <Narration>{lines}</Narration>;

  const color = group.npc?.color ?? Palette.ink;
  return (
    <Row>
      {group.pfp && (
        <Portrait style={{ background: `color-mix(in srgb, ${color} 16%, white)` }}>
          <img src={group.pfp} alt={group.speaker} />
        </Portrait>
      )}
      <Body>
        <Speaker style={{ color: `color-mix(in srgb, ${color} 72%, black)` }}>
          {group.speaker.toUpperCase()}
        </Speaker>
        {lines}
      </Body>
    </Row>
  );
};

const Row = styled.div`
  display: flex;
  gap: 0.8vw;
  align-items: flex-start;
`;

const Portrait = styled.div`
  flex: none;
  width: 3.4vw;
  height: 3.4vw;
  overflow: hidden;
  border: solid ${Palette.ink} 0.15vw;
  border-radius: 0.6vw;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.45vw;
  min-width: 0;
`;

const Narration = styled(Body)`
  color: ${Palette.muted};
`;

const Speaker = styled.div`
  font-family: Pixel;
  font-size: 0.72vw;
  letter-spacing: 0.05vw;
`;

const Text = styled.div`
  font-family: Pixel;
  font-size: 0.74vw;
  line-height: 1.7;
  color: inherit;
  white-space: pre-wrap;
`;
