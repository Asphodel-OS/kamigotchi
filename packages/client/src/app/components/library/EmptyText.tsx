import styled from 'styled-components';

interface Props {
  text: string[];
  size?: number;
}

export const EmptyText = (props: Props) => {
  const { text, size } = props;
  const scale = size ?? 1.2;

  return (
    <Container>
      {text.map((t: string) => (
        <Text key={t} scale={scale}>
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

const Text = styled.div<{ scale: number }>`
  font-size: ${({ scale }) => scale}vw;
  line-height: ${({ scale }) => 3 * scale}vw;
  text-align: center;
`;
