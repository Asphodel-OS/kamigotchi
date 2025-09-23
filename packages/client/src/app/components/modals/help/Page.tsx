import styled from 'styled-components';

import { HelpTabs } from './types';

export const Page = ({ body, tab }: { body: string[]; tab: HelpTabs }) => {
  return (
    <Container lang='en'>
      {body.map((line: string, i: number) => {
        return (
          <Line
            isTitle={tab === HelpTabs.TERMS && i === 0}
            isSubTitle={tab === HelpTabs.TERMS && i === 1}
            key={i}
          >
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

const Line = styled.div<{ isTitle?: boolean; isSubTitle?: boolean }>`
  font-size: 0.9vw;
  line-height: 150%;
  text-align: justify;
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: break-word;
  hyphens: auto;
  ${({ isTitle }) => isTitle && 'font-weight: bold;text-align: center;'}
  ${({ isSubTitle }) => isSubTitle && 'text-align: center; text-decoration: underline; '}
`;
