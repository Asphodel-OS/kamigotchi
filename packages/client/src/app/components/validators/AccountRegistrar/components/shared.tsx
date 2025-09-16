import styled from 'styled-components';

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.45rem;
`;

export const Description = styled.div<{ size: number }>`
  color: #333;
  font-size: ${({ size }) => size}rem;
  line-height: ${({ size }) => size * 2.4}rem;
  text-align: center;
`;

export const Section = styled.div<{ padding: number }>`
  padding: ${({ padding }) => padding}rem;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;
