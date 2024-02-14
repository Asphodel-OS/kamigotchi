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
          <>
            {line}
            <br />
          </>
        );
      })}
    </Body>
  );
};

const Body = styled.div`
  font-size: 1vw;
  color: #333;
  text-align: left;
  line-height: 110%;
  font-family: Pixel;
  padding: 1.5vw;
`;
