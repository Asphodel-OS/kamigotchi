import styled from 'styled-components';

interface LinkPart {
  text: string;
  href: string;
}

type TextPart = string | LinkPart;

export const EmptyText = ({
  text,
  size = 1.2,
  gapScale = 3,
  isHidden,
  linkColor,
}: {
  gapScale?: number; // lineheight proportion to font size
  isHidden?: boolean;
  linkColor?: string;
  size?: number; // font size
  text: TextPart[] | TextPart[][]; //supports single and multiple paragraphs
}) => {
  // checks if there are multiple paragraphs
  const isMultiParagraph = Array.isArray(text[0]);
  return (
    <Container isHidden={!!isHidden}>
      {text.map((line, i) => {
        const parts = Array.isArray(line) ? line : [line];
        return (
          <Text
            key={i}
            size={size}
            gapScale={gapScale}
            linkColor={linkColor}
            isMultiParagraph={isMultiParagraph}
          >
            {parts.map((part, j) => {
              //  plain text
              if (typeof part === 'string') {
                return <span key={j}>{part}</span>;
              }
              //  hyperlinks
              return (
                <a key={j} href={part.href} target='_blank' rel='noopener noreferrer'>
                  {part.text}
                </a>
              );
            })}
          </Text>
        );
      })}
    </Container>
  );
};

const Container = styled.div<{ isHidden: boolean }>`
  overflow-y: auto;
  height: 100%;
  padding: 0.6vw;

  display: ${({ isHidden }) => (isHidden ? 'none' : 'flex')};
  flex-flow: row wrap;
  justify-content: center;
  align-items: center;
  user-select: none;
`;

const Text = styled.div<{
  size: number;
  gapScale: number;
  linkColor?: string;
  isMultiParagraph?: boolean;
}>`
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size, gapScale }) => gapScale * size * 0.8}vw;
  text-align: center;
  white-space: pre-line;

  margin-bottom: ${({ gapScale, isMultiParagraph, size }) =>
    isMultiParagraph ? gapScale * size * 0.3 : 0}vw; // manages space between paragraphs

  a {
    color: ${({ linkColor }) => linkColor ?? '#0077cc'};
    text-decoration: underline;
    &:hover {
      text-decoration: none;
    }
  }
`;
