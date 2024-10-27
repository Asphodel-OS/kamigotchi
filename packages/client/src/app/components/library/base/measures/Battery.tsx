import styled from 'styled-components';

type Props = {
  level: number;
  scale?: number;
};

export const getColor = (level: number) => {
  if (level <= 20) return '#FF6600';
  if (level <= 50) return '#FFD000';
  return '#23AD41';
};

export const Battery = (props: Props) => {
  const { level, scale } = props;

  return (
    <Container>
      <Shell scale={scale ?? 1}>
        <Juice level={level} scale={scale ?? 1} />
      </Shell>
      <Bump scale={scale ?? 1} />
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
  border: 0.15vw solid #444;
  border-radius: ${({ scale }) => scale * 0.25}vw;
  height: ${({ scale }) => scale * 1}vw;
  width: ${({ scale }) => scale * 1.5}vw;
  padding: ${({ scale }) => scale * 0.05}vw;

  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;

const Juice = styled.div<{ level: number; scale: number }>`
  border-radius: ${({ scale }) => scale * 0.2 - 0.15}vw;
  background-color: ${({ level }) => getColor(level)};
  width: ${({ level }) => `${level}%`};
  height: 100%;
`;

const Bump = styled.div<{ scale: number }>`
  background-color: #444;
  border-radius: 0 ${({ scale }) => scale * 0.05}vw ${({ scale }) => scale * 0.05}vw 0;
  margin: ${({ scale }) => scale * 0.03}vw;
  width: ${({ scale }) => scale * 0.09}vw;
  height: ${({ scale }) => scale * 0.33}vw;
`;
