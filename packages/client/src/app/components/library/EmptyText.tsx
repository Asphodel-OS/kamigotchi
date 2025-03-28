import styled from 'styled-components';

interface Props {
  text: string[];
  size?: number; // font size
  gapScale?: number; // lineheight proportion to font size
  isHidden?: boolean;
}

export const EmptyText = (props: Props) => {
  const { text, size, gapScale, isHidden } = props;

  return (
    <Container isHidden={!!isHidden}>
      {text.map((t: string) => (
        <Text key={t} size={size ?? 1.2} gapScale={gapScale ?? 3}>
          {t}
        </Text>
      ))}
    </Container>
  );
};

const Container = styled.div<{ isHidden: boolean }>`
  overflow-y: auto;
  height: 100%;
  padding: 0.6vw;

  display: ${({ isHidden }) => (isHidden ? 'none' : 'flex')};
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  user-select: none;
`;

const Text = styled.div<{ size: number; gapScale: number }>`
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size, gapScale }) => gapScale * size}vw;
  text-align: center;
`;
