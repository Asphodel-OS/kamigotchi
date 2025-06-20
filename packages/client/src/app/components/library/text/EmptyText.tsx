import styled from 'styled-components';

interface LinkPart {
  text: string;
  href: string;
}

type TextPart = string | LinkPart;

interface Props {
  gapScale?: number; // lineheight proportion to font size
  isHidden?: boolean;
  linkColor?: string;
  size?: number; // font size
  text: TextPart[] | TextPart[][]; //supports single and multiple paragraphs
}
export const EmptyText = (props: Props) => {
  const { text, size, gapScale, isHidden, linkColor } = props;
  // checks if there are multiple paragraphs
  const isMultiParagraph = Array.isArray(text[0]);
  return (
    <Container isHidden={!!isHidden}>
      {text.map((line, i) => {
        const parts = Array.isArray(line) ? line : [line];
        return (
          <Text
            key={i}
            size={size ?? 1.2}
            gapScale={gapScale ?? 3}
            linkColor={linkColor}
            isMultiParagraph={isMultiParagraph}
          >
            {parts.map((part, j) => {
              // \n and plain text
              if (typeof part === 'string') {
                return part === '\n' ? <br key={j} /> : <span key={j}>{part}</span>;
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
