import { ReactNode } from 'react';
import styled from 'styled-components';

import { ObjectiveIcon } from './objectiveIcon';
import { Palette } from './palette';

// one objective: icon tile (item / room / generic), text, progress count and an optional action
export const ObjectiveRow = ({
  text,
  icon,
  complete,
  count,
  action,
}: {
  text: string;
  icon?: ObjectiveIcon;
  complete?: boolean;
  count?: string;
  action?: ReactNode;
}) => {
  return (
    <Row complete={!!complete}>
      {icon && (
        <IconTile kind={icon.kind}>
          <img src={icon.src} alt='' />
        </IconTile>
      )}
      <Text>{text}</Text>
      {count && !complete && <Count>{count}</Count>}
      {action}
      <Check complete={!!complete}>{complete ? '✓' : ''}</Check>
    </Row>
  );
};

const Row = styled.div<{ complete: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.55vw;
  padding: 0.35vw 0.6vw;
  min-height: 2.6vw;
  background: ${Palette.paper};
  border: solid ${Palette.line} 0.1vw;
  border-radius: 0.55vw;
  color: ${({ complete }) => (complete ? Palette.faint : Palette.ink)};
`;

const IconTile = styled.div<{ kind?: ObjectiveIcon['kind'] }>`
  flex: none;
  width: 1.9vw;
  height: 1.9vw;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${Palette.soft};
  border: solid ${Palette.line} 0.1vw;
  border-radius: 0.4vw;

  img {
    width: ${({ kind }) => (kind === 'room' ? '100%' : '1.35vw')};
    height: ${({ kind }) => (kind === 'room' ? '100%' : '1.35vw')};
    object-fit: cover;
  }
`;

const Text = styled.span`
  flex: 1;
  min-width: 0;
  font-family: Pixel;
  font-size: 0.66vw;
  line-height: 1.4;
`;

const Count = styled.span`
  flex: none;
  font-family: Pixel;
  font-size: 0.58vw;
  color: ${Palette.muted};
  background: ${Palette.soft};
  border: solid ${Palette.line} 0.08vw;
  border-radius: 99vw;
  padding: 0.12vw 0.4vw;
  font-variant-numeric: tabular-nums;
`;

const Check = styled.span<{ complete: boolean }>`
  flex: none;
  width: 1vw;
  height: 1vw;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6vw;
  color: ${Palette.progress.edge};
  background: ${({ complete }) => (complete ? Palette.progress.fill : Palette.paper)};
  border: solid ${({ complete }) => (complete ? Palette.progress.edge : Palette.line)} 0.1vw;
  border-radius: 99vw;
`;
