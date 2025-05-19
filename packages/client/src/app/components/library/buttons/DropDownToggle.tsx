import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { Popover } from '../poppers/Popover';
import { IconButton } from './IconButton';

interface Props {
  onClick: (selected: any[]) => void;
  img: string;
  checkList: Option[];
  disabled?: boolean;
  balance?: number;
}

interface Option {
  text: string;
  img?: string;
  object?: any;
  disabled?: boolean;
}

export function DropDownToggle(props: Props) {
  const { checkList, disabled, img, balance, onClick } = props;
  const [checked, setChecked] = useState<boolean[]>([]);
  const [forceClose, setForceClose] = useState(false);

  const resetCheckBoxes = () => setChecked(Array(checkList.length).fill(false));

  const toggleCheckbox = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); // prevent popover from closing
    setChecked((prev) => prev.map((val, i) => (i === index ? !val : val)));
  };

  const toggleSelect = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent popover from closing
    const allSelected = checked.every(Boolean);
    setChecked(checked.map(() => !allSelected));
  };

  // necessary to properly create the checked array, this way it waits for the checkList to be populated
  useEffect(() => {
    if (checked.length !== checkList.length) resetCheckBoxes();
  }, [checkList, checked.length]);

  // force close the popover if there are no options left and the checklist is in the process of being emptied
  useEffect(() => {
    if (checkList.length === 0) setForceClose(true);
    else setForceClose(false);
  }, [checkList]);

  const Trigger = () => {
    const handleTriggerClick = () => {
      const selected = checkList.filter((_, i) => checked[i]).map((opt) => opt.object);
      playClick();
      onClick(selected);
    };
    return (
      <IconButton
        img={img}
        disabled={disabled || !checked.includes(true)}
        onClick={handleTriggerClick}
        dropDown={'right'}
      />
    );
  };

  const MenuCheckListOption = (
    { text, img, object }: Option,
    i: number | null,
    onClick: (e: React.MouseEvent) => void,
    isSelectAll: boolean
  ) => {
    const imageSrc = img ?? object?.image;
    const isChecked = isSelectAll ? checked.every(Boolean) : !!checked[i!];
    return (
      <MenuOption
        key={isSelectAll ? 'SelectAll' : `toggle-${i}`}
        onClick={onClick}
        isSelectAll={isSelectAll}
        disabled={disabled}
      >
        <Row>
          <input type='checkbox' checked={isChecked} readOnly />
          <span>{text}</span>
        </Row>
        {imageSrc && <Image src={imageSrc} />}
      </MenuOption>
    );
  };

  const DropDownButton = () => {
    return (
      <IconButton
        text={`${checked.filter((val) => val === true).length} Selected`}
        width={10}
        onClick={() => {}}
        disabled={disabled}
        balance={balance}
        corner={!balance}
        dropDown={'left'}
      />
    );
  };

  return (
    <Container>
      <Popover
        content={[
          MenuCheckListOption({ text: 'Select All' }, null, (e) => toggleSelect(e), true),
          ...checkList.map((option, i) =>
            MenuCheckListOption(option, i, (e) => toggleCheckbox(e, i), false)
          ),
        ]}
        onClose={resetCheckBoxes}
        disabled={disabled}
        forceClose={forceClose}
      >
        {DropDownButton()}
      </Popover>
      {Trigger()}
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
