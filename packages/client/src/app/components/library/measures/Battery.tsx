import styled from 'styled-components';

export const getColor = (level: number) => {
  if (level <= 20) return '#FF6600';
  if (level <= 50) return '#FFD000';
  return '#23AD41';
};

export const Battery = ({
  level,
  scale = 1,
}: {
  level: number
  scale?: number
}) => {

  return (
    <Container>
      <Shell scale={scale}>
        <Juice level={level} scale={scale} />
      </Shell>
      <Bump scale={scale} />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const Shell = styled.div<{ scale: number }>`
  border: 0.15rem solid #444;
  border-radius: ${({ scale }) => scale * 0.25}rem;
  height: ${({ scale }) => scale * 1}rem;
  width: ${({ scale }) => scale * 1.5}rem;
  padding: ${({ scale }) => scale * 0.05}rem;

  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;

const Juice = styled.div<{ level: number; scale: number }>`
  border-radius: ${({ scale }) => scale * 0.2 - 0.15}rem;
  background-color: ${({ level }) => getColor(level)};
  width: ${({ level }) => `${level}%`};
  height: 100%;
`;

const Bump = styled.div<{ scale: number }>`
  background-color: #444;
  border-radius: 0 ${({ scale }) => scale * 0.05}rem ${({ scale }) => scale * 0.05}rem 0;
  margin: ${({ scale }) => scale * 0.03}rem;
  width: ${({ scale }) => scale * 0.09}rem;
  height: ${({ scale }) => scale * 0.33}rem;
`;
