import styled from 'styled-components';

interface Props {
  text: string[];
  size?: number;
  gapScale?: number;
}

export const EmptyText = (props: Props) => {
  const { text, size, gapScale } = props;

  return (
    <Container>
      {text.map((t: string) => (
        <Text key={t} size={size ?? 1.2} gapScale={gapScale ?? 3}>
          {t}
        </Text>
      ))}
    </Container>
  );
};

const Container = styled.div`
  overflow-y: scroll;
  height: 100%;
  padding: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

const Text = styled.div<{ size: number; gapScale: number }>`
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size, gapScale }) => gapScale * size}vw;
  text-align: center;
`;
