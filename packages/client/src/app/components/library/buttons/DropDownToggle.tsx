import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { Popover } from '../poppers/Popover';
import { IconButton } from './IconButton';

interface Props {
  onClick: (selected: any[]) => void;
  img: string;
  deployOptions: Option[];
  disabled?: boolean;
  balance?: number;
  radius?: number;
}

interface Option {
  text: string;
  img?: string;
  object?: any;
  disabled?: boolean;
}

export function DropDownToggle(props: Props) {
  const { deployOptions, img, onClick } = props;
  const { balance, disabled, radius } = props;
  const [checked, setChecked] = useState<boolean[]>([]);
  const [forceClose, setForceClose] = useState(false);

  // necessary to properly create the checked array, this way it waits for the deployOptions to be populated
  useEffect(() => {
    if (checked.length !== deployOptions.length) resetCheckBoxes();
  }, [deployOptions, checked.length]);

  // force close the popover if there are no options left and the checklist is in the process of being emptied
  useEffect(() => {
    if (deployOptions.length === 0) setForceClose(true);
    else setForceClose(false);
  }, [deployOptions]);

  const resetCheckBoxes = () => setChecked(Array(deployOptions.length).fill(false));

  const toggleOption = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); // prevent popover from closing
    setChecked((prev) => prev.map((val, i) => (i === index ? !val : val)));
  };

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent popover from closing
    const allSelected = checked.every(Boolean);
    setChecked(checked.map(() => !allSelected));
  };

  const handleTriggerClick = () => {
    const selected = deployOptions.filter((_, i) => checked[i]).map((opt) => opt.object);
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

  return (
    <Container>
      <Popover
        content={[
          MenuCheckListOption({ text: 'Select All' }, null, (e) => toggleAll(e), true),
          ...deployOptions.map((option, i) =>
            MenuCheckListOption(option, i, (e) => toggleOption(e, i), false)
          ),
        ]}
        onClose={resetCheckBoxes}
        disabled={disabled}
        forceClose={forceClose}
      >
        <IconButton
          text={`${checked.filter((val) => val === true).length} Selected`}
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
