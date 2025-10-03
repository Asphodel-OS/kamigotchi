import styled from 'styled-components';

const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'];

export const Pagination = ({
  setSearch,
  selectedLetter,
  onSelect,
  isVisible,
}: {
  setSearch: React.Dispatch<React.SetStateAction<string>>;
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
          onClick={() => {
            setSearch('');
            onSelect(letter);
          }}
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
  gap: 0.5rem;
  margin: 1rem 0;
`;

const Letter = styled.div<{ isSelected: boolean }>`
  padding: 0.3rem 0.6rem;
  border-radius: 0.3rem;
  color: black;
  cursor: pointer;
  font-size: 0.8rem;
  background-color: ${({ isSelected }) => (isSelected ? '#b2b2b2' : '#efefef')};
  display: flex;
  &:hover {
    background-color: #ddd;
  }
`;
