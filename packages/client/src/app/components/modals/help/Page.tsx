import styled from 'styled-components';

export const Page = ({
  body,
}: {
  body: string[]
}) => {
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
  padding: 1.5em;
`;

const Line = styled.div`
  font-size: 0.9em;
  line-height: 150%;
  text-align: left;
`;
