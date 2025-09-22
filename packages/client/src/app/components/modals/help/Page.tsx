import styled from 'styled-components';

import { HelpTabs } from './types';

export const Page = ({ body, tab }: { body: string[]; tab: HelpTabs }) => {
  return (
    <Container lang='en'>
      {body.map((line: string, i: number) => {
        return (
          <Line lang='en' key={i}>
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
  position: relative;
  white-space: pre-wrap;
`;

const Line = styled.div`
  font-size: 0.9vw;
  line-height: 150%;
  text-align: justify;
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: break-word;
  hyphens: auto;
`;
