import styled from 'styled-components';

interface Props {
  text: string[];
}

export const EmptyText = (props: Props) => {
  const { text } = props;
  return (
    <Container>
      {text.map((t: string) => (
        <Text key={t}>{t}</Text>
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

const Text = styled.div`
  font-size: 1.2vw;
  line-height: 3.6vw;
  text-align: center;
`;
