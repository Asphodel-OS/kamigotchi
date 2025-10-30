import styled from 'styled-components';

import { TxStatusIcons } from 'assets/images/icons/indicators';
import { Status } from './types';

const IconMap = {
  WRONG: TxStatusIcons.failure,
  FIXING: TxStatusIcons.executing,
  FIXED: TxStatusIcons.success,
};

export const StatusCircle = ({ state, size }: { state: Status; size?: number }) => {
  return (
    <Container size={size ?? 3}>
      <Icon src={IconMap[state]} />
    </Container>
  );
};

const Container = styled.div<{ size: number }>`
  position: relative;
  border-radius: 50%;
  border: dashed black ${({ size }) => size / 15}rem;
  margin: 0.3rem;

  width: ${({ size }) => size}rem;
  height: ${({ size }) => size}rem;

  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const Icon = styled.img`
  width: 70%;
  overflow: hidden;
  user-drag: none;
`;
