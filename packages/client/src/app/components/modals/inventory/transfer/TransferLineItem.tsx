import { ChangeEvent } from 'react';
import styled from 'styled-components';

import { IconButton, IconListButton, IconListButtonOption } from 'app/components/library';
import { Item } from 'network/shapes';
import { playClick } from 'utils/sounds';

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
  const handleMaxClick = () => {
    playClick();
    onMax();
  };

  // Check if amount exceeds balance
  const isOverBalance = !!selected && amt > balance;

  return (
    <Container>
      {/* Item Selector */}
      <ItemSelectorWrapper>
        <IconListButton
          options={options}
          searchable
          img={selected?.image}
          text={selected?.name ?? 'Select item...'}
          fullWidth
        />
      </ItemSelectorWrapper>

      {/* Amount Input with Max Button */}
      <QuantityWrapper>
        <Quantity
          type='text'
          value={amt.toLocaleString()}
          onChange={setAmt}
          disabled={!selected}
          $isError={isOverBalance}
        />
        <MaxButton onClick={handleMaxClick} disabled={!selected} type='button'>
          Max
        </MaxButton>
      </QuantityWrapper>

      {/* Action Buttons */}
      <ActionButtons>
        <IconButton text='×' onClick={onRemove} scale={1.8} width={1.8} />
        <IconButton text='+' onClick={onAdd} scale={1.8} width={1.8} />
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
  flex: 1;
  min-width: 0;
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
    background: #1976d2;
  }

  &:active:not(:disabled) {
    background: #1565c0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.4vw;
  flex-shrink: 0;
`;
