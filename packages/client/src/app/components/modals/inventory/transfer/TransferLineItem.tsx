import { ChangeEvent, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { IconButton, IconListButtonOption } from 'app/components/library';
import { playClick } from 'utils/sounds';
import { Item } from 'network/shapes';

export const TransferLineItem = ({
  options,
  selected,
  amt,
  balance,
  setAmt,
  onRemove,
  onAdd,
  onMax,
}: {
  options: IconListButtonOption[];
  selected: Item | null;
  amt: number;
  balance: number;
  setAmt: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onAdd: () => void;
  onMax: () => void;
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDropdown = () => {
    playClick();
    setIsDropdownOpen(!isDropdownOpen);
    if (isDropdownOpen) setSearch('');
  };

  const handleSelectItem = (option: IconListButtonOption) => {
    playClick();
    option.onClick();
    setIsDropdownOpen(false);
    setSearch('');
  };

  const handleMaxClick = () => {
    playClick();
    onMax();
  };

  const filteredOptions = options.filter((opt) =>
    opt.text.toLowerCase().includes(search.toLowerCase())
  );

  // Check if amount exceeds balance
  const isOverBalance = !!selected && amt > balance;

  return (
    <Container>
      {/* Item Selector */}
      <ItemSelectorWrapper>
        <ItemButton
          ref={triggerRef}
          onClick={handleToggleDropdown}
          $hasSelection={!!selected}
        >
          {selected ? (
            <>
              <ItemIcon src={selected.image} alt={selected.name} />
              <ItemName>{selected.name}</ItemName>
            </>
          ) : (
            <PlaceholderText>Select item...</PlaceholderText>
          )}
          <DropdownArrow>▾</DropdownArrow>
        </ItemButton>

        {isDropdownOpen && (
          <DropdownMenu ref={dropdownRef}>
            <SearchInput
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
            <OptionsList>
              {filteredOptions.length === 0 ? (
                <NoOptionsText>No items available</NoOptionsText>
              ) : (
                filteredOptions.map((option, i) => (
                  <OptionItem key={i} onClick={() => handleSelectItem(option)}>
                    {option.image && <OptionIcon src={option.image} />}
                    <OptionText>{option.text}</OptionText>
                  </OptionItem>
                ))
              )}
            </OptionsList>
          </DropdownMenu>
        )}
      </ItemSelectorWrapper>

      {/* Amount Input with Max Button */}
      <QuantityWrapper>
        <Quantity
          type="text"
          value={amt.toLocaleString()}
          onChange={setAmt}
          disabled={!selected}
          $isError={isOverBalance}
        />
        <MaxButton
          onClick={handleMaxClick}
          disabled={!selected}
          type="button"
        >
          Max
        </MaxButton>
      </QuantityWrapper>

      {/* Action Buttons */}
      <ActionButtons>
        <IconButton
          text="×"
          onClick={onRemove}
          scale={1.8}
          width={1.8}
        />
        <IconButton
          text="+"
          onClick={onAdd}
          scale={1.8}
          width={1.8}
        />
      </ActionButtons>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  min-height: 3vw;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6vw;
  padding: 0.4vw 0.2vw;
  background: #fff;
  border-radius: 0.3vw;
  border: 0.08vw solid #e0e0e0;
`;

const ItemSelectorWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

const ItemButton = styled.button<{ $hasSelection: boolean }>`
  width: 100%;
  height: 2.5vw;
  display: flex;
  align-items: center;
  gap: 0.5vw;
  padding: 0.3vw 0.6vw;
  background: ${({ $hasSelection }) => ($hasSelection ? '#fff' : '#f8f8f8')};
  border: 0.12vw solid ${({ $hasSelection }) => ($hasSelection ? '#333' : '#aaa')};
  border-radius: 0.4vw;
  cursor: pointer;
  font-family: Pixel, sans-serif;
  font-size: 0.8vw;
  transition: all 0.15s;

  &:hover {
    background: #f0f0f0;
    border-color: #666;
  }
`;

const ItemIcon = styled.img`
  width: 1.8vw;
  height: 1.8vw;
  object-fit: contain;
`;

const ItemName = styled.span`
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333;
`;

const PlaceholderText = styled.span`
  flex: 1;
  text-align: left;
  color: #888;
  font-style: italic;
`;

const DropdownArrow = styled.span`
  color: #666;
  font-size: 0.7vw;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.2vw;
  background: white;
  border: 0.12vw solid #333;
  border-radius: 0.35vw;
  z-index: 100;
  max-height: 30vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0.2vw 0.5vw rgba(0, 0, 0, 0.15);
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.4vw 0.5vw;
  border: none;
  border-bottom: 0.08vw solid #ddd;
  font-family: Pixel, sans-serif;
  font-size: 0.7vw;
  outline: none;

  &::placeholder {
    color: #aaa;
  }
`;

const OptionsList = styled.div`
  overflow-y: auto;
  max-height: 27vh;

  ::-webkit-scrollbar {
    background: transparent;
    width: 0.5vw;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 0.25vw;
  }
`;

const OptionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
  padding: 0.35vw 0.5vw;
  cursor: pointer;
  transition: background 0.1s;

  &:hover {
    background: #f0f0f0;
  }
`;

const OptionIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
  object-fit: contain;
`;

const OptionText = styled.span`
  font-size: 0.7vw;
  color: #333;
`;

const NoOptionsText = styled.div`
  padding: 0.5vw;
  text-align: center;
  color: #888;
  font-size: 0.65vw;
  font-style: italic;
`;

const QuantityWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3vw;
  flex-shrink: 0;
`;

const Quantity = styled.input<{ $isError?: boolean }>`
  width: 5vw;
  height: 2.5vw;
  padding: 0.4vw;
  border: 0.12vw solid ${({ $isError }) => ($isError ? '#e74c3c' : '#333')};
  border-radius: 0.4vw;
  background: ${({ $isError }) => ($isError ? '#ffeaea' : '#fff')};
  color: ${({ $isError }) => ($isError ? '#c0392b' : '#333')};
  font-family: Pixel, sans-serif;
  font-size: 0.65vw;
  text-align: center;

  &:disabled {
    background: #eee;
    border-color: #ccc;
    color: #999;
    cursor: not-allowed;
  }
`;

const MaxButton = styled.button<{ disabled?: boolean }>`
  height: 2.5vw;
  padding: 0 0.6vw;
  background: ${({ disabled }) => (disabled ? '#e0e0e0' : '#2196F3')};
  color: ${({ disabled }) => (disabled ? '#999' : 'white')};
  border: 0.1vw solid ${({ disabled }) => (disabled ? '#ccc' : '#1976D2')};
  border-radius: 0.35vw;
  font-family: Pixel, sans-serif;
  font-size: 0.7vw;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: #1976D2;
  }

  &:active:not(:disabled) {
    background: #1565C0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.4vw;
  flex-shrink: 0;
`;
