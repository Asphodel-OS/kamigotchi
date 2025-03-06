import styled from 'styled-components';

import { HelpIcon } from 'assets/images/icons/menu';
import { Tooltip } from './base';

interface Props {
  tooltip: string[];
  size?: string;
}

export const HelpChip = (props: Props) => {
  return (
    <Tooltip text={props.tooltip}>
      <Icon size={props.size ?? 'medium'} src={HelpIcon} />
    </Tooltip>
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
