import styled from 'styled-components';

const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'];

export const Pagination = ({
  selectedLetter,
  onSelect,
  isVisible,
}: {
  selectedLetter: string;
  onSelect: React.Dispatch<React.SetStateAction<string>>;
  isVisible: boolean;
}) => {
  return (
    <LetterIndex isVisible={isVisible}>
      {alphabet.map((letter) => (
        <Letter
          key={letter}
          isSelected={letter === selectedLetter}
          onClick={() => onSelect(letter)}
        >
          {letter}
        </Letter>
      ))}
    </LetterIndex>
  );
};

const LetterIndex = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5em;
  margin: 1em 0;
`;

const Letter = styled.div<{ isSelected: boolean }>`
  padding: 0.3em 0.6em;
  border-radius: 0.3em;
  color: black;
  cursor: pointer;
  font-size: 0.8em;
  background-color: ${({ isSelected }) => (isSelected ? '#b2b2b2' : '#efefef')};
  display: flex;
  &:hover {
    background-color: #ddd;
  }
`;
