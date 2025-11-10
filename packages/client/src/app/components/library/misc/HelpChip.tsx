import styled from 'styled-components';

import { HelpIcon } from 'assets/images/icons/menu';
import { TextTooltip } from '..';

export const HelpChip = ({
  tooltip,
  size = 1.5,
}: {
  tooltip: {
    text: string[];
    size?: number;
  };
  size?: number;
}) => {
  return (
    <TextTooltip text={tooltip.text} size={tooltip.size}>
      <Icon size={size} src={HelpIcon} />
    </TextTooltip>
  );
};

const Icon = styled.img<{ size: number }>`
  margin: 0.1em 0.5em;
  width: ${({ size }) => size}em;
  height: ${({ size }) => size}em;
  user-drag: none;
`;
