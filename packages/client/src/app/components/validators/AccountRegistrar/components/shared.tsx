import styled from 'styled-components';

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0.3vw;
  margin-top: 0.45vw;
`;

export const Description = styled.div<{ size: number }>`
  color: #333;
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size }) => size * 2.4}vw;
  text-align: center;
`;

export const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  padding: 0.9vw;
`;
