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
  margin: 0.1rem 0.5rem;
  user-drag: none;

  ${({ size }) => {
    if (size === 'small')
      return `
      width: 1rem;
      height: 1rem;
    `;

    if (size === 'medium')
      return `
      width: 1.5rem;
      height: 1.5rem;
    `;

    if (size === 'large')
      return `
      width: 2rem;
      height: 2rem;
    `;
  }}
`;
