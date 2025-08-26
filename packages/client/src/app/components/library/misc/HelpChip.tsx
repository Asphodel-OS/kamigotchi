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
  margin: 0.1vh 0.5vw;
  user-drag: none;

  ${({ size }) => {
    if (size === 'small')
      return `
      width: 1vw;
      height: 1vw;
    `;

    if (size === 'medium')
      return `
      width: 1.5vw;
      height: 1.5vw;
    `;

    if (size === 'large')
      return `
      width: 2vw;
      height: 2vw;
    `;
  }}
`;
