import styled from 'styled-components';

import { TermsAndConditions } from 'assets/documents';
import { HelpTabs } from './types';

export const Page = ({ body, tab }: { body: string[]; tab: HelpTabs }) => {
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
      {tab === HelpTabs.TERMS && (
        <GasLink
          key='terms&conditions'
          href={TermsAndConditions}
          target='_blank'
          rel='noopener noreferrer'
        >
          Our Terms & Conditions
        </GasLink>
      )}
    </Container>
  );
};

const Container = styled.div`
  color: #333;
  padding: 1.5vw;
  position: relative;
`;

const Line = styled.div`
  font-size: 0.9vw;
  line-height: 150%;
  text-align: left;
`;

const GasLink = styled.a<{ linkColor?: string }>`
  color: ${({ linkColor }) => linkColor ?? '#145006ff'};
  font-size: 0.8vw;
  text-decoration: underline;
  &:hover {
    text-decoration: none;
  }
`;
