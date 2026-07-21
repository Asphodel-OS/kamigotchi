import styled from 'styled-components';

// before and after are used to write plain text in the same line as the link
// href opens an external page; onClick handles in-app actions (e.g. opening a modal)
type Link = {
  before?: string;
  linkText: string;
  after?: string;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

type TextPart = string | Link;

export const EmptyText = ({
  text,
  size = 1.2,
  gapScale = 3,
  linkColor = '#0077ccff',
  textColor = '#333333ff',
  isHidden,
}: {
  text: TextPart[];
  size?: number;
  gapScale?: number;
  linkColor?: string;
  textColor?: string;
  isHidden?: boolean;
}) => {
  return (
    <Container isHidden={!!isHidden}>
      {
        // plain text
        text.map((part, index) => {
          if (typeof part === 'string') {
            return (
              <Text key={index} size={size} color={textColor} gapScale={gapScale}>
                {part}
              </Text>
            );
          } else if (typeof part === 'object') {
            return (
              <Text key={index} size={size} color={textColor} gapScale={gapScale}>
                {part.before}
                <Link
                  as={part.href ? 'a' : 'button'}
                  href={part.href}
                  target={part.href ? '_blank' : undefined}
                  rel={part.href ? 'noopener noreferrer' : undefined}
                  onClick={part.onClick}
                  size={size}
                  color={linkColor}
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

const Text = styled.div<{ size: number; gapScale: number; color: string }>`
  color: ${({ color }) => color};
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size, gapScale }) => gapScale * size}vw;
  text-align: center;
  pointer-events: auto;
`;

// button resets keep the onClick variant visually identical to the anchor
const Link = styled.a<{ size: number; gapScale: number; color: string }>`
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  color: ${({ color }) => color};
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size, gapScale }) => gapScale * size}vw;
  text-decoration: underline;
  cursor: pointer;
  &:hover {
    text-decoration: none;
  }
`;
