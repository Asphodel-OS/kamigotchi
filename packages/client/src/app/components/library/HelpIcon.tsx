import styled from 'styled-components';

import { helpIcon } from 'assets/images/icons/menu';
import { Tooltip } from './Tooltip';

interface Props {
  tooltip: string[];
  size?: string;
}

export const HelpIcon = (props: Props) => {
  return (
    <Tooltip text={props.tooltip}>
      <Icon size={props.size ?? 'medium'} src={helpIcon} />
    </Tooltip>
  );
};

const Icon = styled.img<{ size: string }>`
  margin: 0.1vh 0.5vw;

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
