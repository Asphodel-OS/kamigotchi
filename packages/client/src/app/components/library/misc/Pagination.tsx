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
  gap: 0.5vw;
  margin: 1vw 0;
`;

const Letter = styled.div<{ isSelected: boolean }>`
  padding: 0.3vw 0.6vw;
  border-radius: 0.3vw;
  color: black;
  cursor: pointer;
  font-size: 0.8vw;
  background-color: ${({ isSelected }) => (isSelected ? '#b2b2b2' : '#efefef')};
  display: flex;
  &:hover {
    background-color: #ddd;
  }
`;
