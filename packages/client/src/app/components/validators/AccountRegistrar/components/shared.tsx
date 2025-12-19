import styled from 'styled-components';

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0.3em;
  margin-top: 0.45em;
`;

export const Description = styled.div<{ size: number }>`
  color: #333;
  font-size: ${({ size }) => size}em;
  line-height: ${({ size }) => size * 2.4}em;
  text-align: center;
`;

export const Section = styled.div<{ padding: number }>`
  padding: ${({ padding }) => padding}em;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;
