import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { Popover } from '../poppers/Popover';
import { IconButton } from './IconButton';

interface Props {
  onClick: (selected: any[]) => void;
  img: string;
  options: Option[];
  disabled?: boolean;
  balance?: number;
  radius?: number;
  limit?: number;
}

interface Option {
  text: string;
  img?: string;
  object?: any;
  disabled?: boolean;
}

export function DropDownToggle(props: Props) {
  const { options, img, onClick, limit } = props;
  const { balance, disabled, radius } = props;
  const [checked, setChecked] = useState<boolean[]>([]);
  const [forceClose, setForceClose] = useState(false);

  // necessary to properly create the checked array, this way it waits for the options to be populated
  useEffect(() => {
    if (checked.length !== options.length) setChecked(Array(options.length).fill(false));
  }, [options]);

  // force close the popover if there are no options left and the checklist is in the process of being emptied
  useEffect(() => {
    if (options.length === 0) setForceClose(true);
    else setForceClose(false);
  }, [options]);

  const toggleOption = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); // prevent popover from closing
    setChecked((prev) => {
      const selected = prev.filter(Boolean).length;
      // !prev[index] is neccesary so the player can decrease the number of selected options when the limit is reached
      if (!prev[index] && limit && selected >= limit) return prev;
      return prev.map((val, i) => (i === index ? !val : val));
    });
  };

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent popover from closing
    // currently selected
    const selected = checked.filter(Boolean).length;
    // limit
    const selectLimit = Math.min(limit ?? options.length, options.length);
    // check if all are selected
    const allSelected = selected >= selectLimit;
    // If all selected deselect all, else select up to the limit
    setChecked(checked.map((_, i) => !allSelected && i < selectLimit));
  };

  const handleTriggerClick = () => {
    const selected = options.filter((_, i) => checked[i]).map((opt) => opt.object);
    playClick();
    onClick(selected);
  };

  const MenuCheckListOption = (
    { text, img, object }: Option,
    i: number | null,
    onClick: (e: React.MouseEvent) => void,
    isSelectAll: boolean
  ) => {
    const imageSrc = img ?? object?.image;
    const selected = checked.filter(Boolean).length;
    const isChecked = isSelectAll
      ? limit
        ? selected >= Math.min(limit, options.length)
        : checked.every(Boolean)
      : !!checked[i!];

    return (
      <MenuOption
        key={isSelectAll ? 'SelectAll' : `toggle-${i}`}
        onClick={onClick}
        isSelectAll={isSelectAll}
        disabled={disabled}
      >
        <Row>
          <input type='checkbox' checked={isChecked} readOnly />
          <span>
            {text}
            {isSelectAll && limit && selected >= limit ? ` (max ${limit})` : ''}
          </span>
        </Row>
        {imageSrc && <Image src={imageSrc} />}
      </MenuOption>
    );
  };

  return (
    <Container>
      <Popover
        content={[
          MenuCheckListOption({ text: 'Select All' }, null, (e) => toggleAll(e), true),
          ...options.map((option, i) =>
            MenuCheckListOption(option, i, (e) => toggleOption(e, i), false)
          ),
        ]}
        disabled={disabled}
        forceClose={forceClose}
      >
        <IconButton
          text={`${checked.filter(Boolean).length} Selected`}
          width={10}
          onClick={() => {}}
          disabled={disabled}
          balance={balance}
          corner={!balance}
          flatten={'right'}
          radius={radius ?? 0.45}
        />
      </Popover>
      <IconButton
        img={img}
        disabled={disabled || !checked.includes(true)}
        onClick={handleTriggerClick}
        flatten={'left'}
        radius={radius ?? 0.45}
      />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
`;

const MenuOption = styled.div<{
  disabled?: boolean;
  isSelectAll?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: left;
  gap: 0.4vw;
  border-radius: 0.4vw;
  font-size: 0.8vw;
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  padding: ${({ isSelectAll }) => (isSelectAll ? '1vw 0.6vw 0.4vw 0.9vw ' : '0 0.2vw 0.1vw 2.2vw')};

  &:hover {
    background-color: #ddd;
  }
`;

const Row = styled.span`
  display: flex;
  align-items: center;
  gap: 0.6vw;
`;

const Image = styled.img`
  height: 2vw;
  width: 2vw;
  object-fit: cover;
  margin-left: auto;
  border-radius: 0.3vw;
  border: solid black 0.05vw;
`;
