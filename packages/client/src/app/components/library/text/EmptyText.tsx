import styled from 'styled-components';

interface LinkPart {
  text: string;
  href: string;
}

type TextPart = string | LinkPart;

interface Props {
  text: TextPart[] | TextPart[][];
  size?: number;
  gapScale?: number;
  isHidden?: boolean;
  linkColor?: string;
}
export const EmptyText = (props: Props) => {
  const { text, size, gapScale, isHidden, linkColor } = props;

  return (
    <Container isHidden={!!isHidden}>
      {text.map((line, i) => {
        const parts = Array.isArray(line) ? line : [line];
        return (
          <Text key={i} size={size ?? 1.2} gapScale={gapScale ?? 3} linkColor={linkColor}>
            {parts.map((part, j) => {
              if (typeof part === 'string') {
                return part === '\n' ? <br key={j} /> : <span key={j}>{part}</span>;
              }
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

const Text = styled.div<{ size: number; gapScale: number; linkColor?: string }>`
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size }) => size * 2.2}vw;
  text-align: center;
  margin-bottom: ${({ gapScale }) => gapScale * 0.3}vw; //controls space between paragraphs

  a {
    color: ${({ linkColor }) => linkColor ?? '#0077cc'};
    text-decoration: underline;
    &:hover {
      text-decoration: none;
    }
  }
`;
