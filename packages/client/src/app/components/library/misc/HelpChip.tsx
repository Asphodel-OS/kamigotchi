import styled from 'styled-components';

import { HelpIcon } from 'assets/images/icons/menu';
import { TextTooltip } from '..';

export const HelpChip = ({
  tooltip,
  size = 'medium',
}: {
  tooltip: string[];
  size?: string;
}) => {
  return (
    <TextTooltip text={tooltip}>
      <Icon size={size} src={HelpIcon} />
    </TextTooltip>
  );
};

const Icon = styled.img<{ size: string }>`
  margin: 0.1em 0.5em;
  user-drag: none;

  ${({ size }) => {
    if (size === 'small')
      return `
      width: 1em;
      height: 1em;
    `;

    if (size === 'medium')
      return `
      width: 1.5em;
      height: 1.5em;
    `;

    if (size === 'large')
      return `
      width: 2em;
      height: 2em;
    `;
  }}
`;
