import styled from 'styled-components';

interface Props {
  body: string[];
}

export const Page = (props: Props) => {
  const { body } = props;
  return (
    <Container>
      {body.map((line: string, i: number) => {
        return (
          <Line key={i}>
            {line}
            <br />
          </Line>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  color: #333;
  padding: 1.5vw;
`;

const Line = styled.div`
  font-size: 0.9vw;
  line-height: 150%;
  text-align: left;
`;
