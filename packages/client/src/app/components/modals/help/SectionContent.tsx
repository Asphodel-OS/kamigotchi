import styled from 'styled-components';

interface Props {
  body: string[];
}

export const SectionContent = (props: Props) => {
  const { body } = props;
  return (
    <Body>
      {body.map((line: string) => {
        return (
          <Line key={line}>
            {line}
            <br />
          </Line>
        );
      })}
    </Body>
  );
};

const Body = styled.div`
  color: #333;
  padding: 1.5vw;
`;

const Line = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  line-height: 110%;
  text-align: left;
`;
