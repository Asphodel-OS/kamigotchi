import styled from 'styled-components';

// before and after are used to write plain text in the same line as the link
interface Link {
  before?: string;
  linkText: string;
  href: string;
  after?: string;
}

type TextPart = string | Link;

interface Props {
  text: TextPart[];
  size?: number;
  gapScale?: number;
  isHidden?: boolean;
  linkColor?: string;
}

export const EmptyText = ({ text, size = 1.2, gapScale = 3, isHidden, linkColor }: Props) => {
  return (
    <Container isHidden={!!isHidden}>
      {
        // plain text
        text.map((part, index) => {
          if (typeof part === 'string') {
            return (
              <Text key={index} size={size} gapScale={gapScale}>
                {part}
              </Text>
            );
          }
          // link
          if (typeof part === 'object' && 'linkText' in part) {
            return (
              <Text key={index} size={size} gapScale={gapScale}>
                {part.before}
                <Link
                  href={part.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  size={size}
                  linkColor={linkColor}
                  gapScale={gapScale}
                >
                  {part.linkText}
                </Link>
                {part.after}
              </Text>
            );
          }
        })
      }
    </Container>
  );
};

const Container = styled.div<{ isHidden: boolean }>`
  overflow-y: auto;
  height: 100%;
  padding: 0.6vw;

  display: ${({ isHidden }) => (isHidden ? 'none' : 'flex')};
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  user-select: none;
`;

const Text = styled.div<{ size: number; gapScale: number }>`
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size, gapScale }) => gapScale * size}vw;
  text-align: center;
`;

const Link = styled.a<{ size: number; linkColor?: string; gapScale: number }>`
  color: ${({ linkColor }) => linkColor ?? '#0077cc'};
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size, gapScale }) => gapScale * size}vw;
  text-decoration: underline;
  &:hover {
    text-decoration: none;
  }
`;
