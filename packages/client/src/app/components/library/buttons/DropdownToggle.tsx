import FilterListIcon from '@mui/icons-material/FilterList';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { Tooltip } from '../poppers';
import { Popover } from '../poppers/Popover';
import { IconButton } from './IconButton';
import { VerticalToggle } from './VerticalToggle';

interface Option {
  text: string;
  img?: string;
  object?: any;
  disabled?: boolean;
}

export const DropdownToggle = ({
  onClick,
  button,
  options,
  disabled = [],
  balance,
  radius = 0.45,
  simplified,
  limit,
}: {
  onClick: ((selected: any[]) => void)[];
  button: {
    images: string[];
    tooltips?: string[];
  };
  options: Option[][];
  disabled?: boolean[];
  balance?: number;
  radius?: number;
  simplified?: boolean;
  limit?: number;
}) => {
  const { images, tooltips } = button;
  const [checked, setChecked] = useState<boolean[]>([]);
  const [modeSelected, setModeSelected] = useState<number>(0);
  const [forceClose, setForceClose] = useState(false);

  // to avoid overcomplicating the code
  // we should pass disabled,onClick,img and options as arrays
  const currentMode = options.length === 1 ? 0 : modeSelected;
  const modeOptions = options[currentMode] ?? [];
  const modeDisabled = disabled?.[currentMode] ?? false;

  // necessary to properly create the checked array,
  // this way it waits for the options to be populated
  useEffect(() => {
    if (checked.length !== modeOptions.length) {
      const initialChecked = Array(modeOptions.length).fill(false);
      setChecked(initialChecked);
      // if simplified,  first option is selected by default
      if (simplified) {
        setTimeout(() => {
          initialChecked[0] = true;
          setChecked(initialChecked);
          // onClick[currentMode]?.([modeOptions[0].object]);
        }, 1000);
      }
    }
  }, [modeOptions]);

  useEffect(() => {
    setChecked([]);
  }, [currentMode]);

  // force close the popover if there are no options left
  // and the checklist is in the process of being emptied
  useEffect(() => {
    setForceClose(modeOptions.length === 0);
  }, [modeOptions]);

  const toggleOption = (e: React.MouseEvent, index: number) => {
    // prevent popover from closing
    if (simplified) {
      const newChecked = Array(modeOptions.length).fill(false);
      newChecked[index] = true;
      setChecked(newChecked);
      playClick();
      onClick[currentMode]?.([modeOptions[index].object]);
    } else {
      e.stopPropagation();
      setChecked((prev) => {
        const selected = prev.filter(Boolean).length;
        // !prev[index] is neccesary so the player can decrease
        // the number of selected options when the limit is reached
        if (!prev[index] && limit && selected >= limit) return prev;
        return prev.map((val, i) => (i === index ? !val : val));
      });
    }
  };

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent popover from closing
    // currently selected
    const selected = checked.filter(Boolean).length;
    // limit
    const selectLimit = Math.min(limit ?? modeOptions.length, modeOptions.length);
    // check if all are selected
    const allSelected = selected >= selectLimit;
    // If all selected deselect all, else select up to the limit
    setChecked(checked.map((_, i) => !allSelected && i < selectLimit));
  };

  const handleTriggerClick = () => {
    const selected = modeOptions.filter((_, index) => checked[index]);
    const selectedObjects = selected.map((option) => option.object);
    playClick();
    onClick[currentMode]?.(selectedObjects);
  };

  const MenuCheckListOption = (
    { text, img, object }: Option,
    i: number | null,
    onClick: (e: React.MouseEvent) => void,
    isSelectAll: boolean
  ) => {
    const imageSrc = img ?? object?.image;
    const selected = checked.filter(Boolean).length;

    const maxSelectable = Math.min(limit ?? modeOptions.length, modeOptions.length);
    const allSelected = selected >= maxSelectable;
    const isChecked = isSelectAll ? allSelected : !!checked[i!];

    return (
      <MenuOption
        key={isSelectAll ? 'SelectAll' : `toggle-${i}`}
        onClick={onClick}
        isSelectAll={isSelectAll}
        disabled={modeDisabled}
      >
        <Row simplified={simplified}>
          <input
            type={simplified ? 'radio' : 'checkbox'}
            checked={isChecked}
            readOnly
            name={simplified ? `dropdown-${currentMode}` : undefined}
          />
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
          ...(simplified
            ? []
            : [MenuCheckListOption({ text: 'Select All' }, null, (e) => toggleAll(e), true)]),
          ...modeOptions.map((option, i) =>
            MenuCheckListOption(option, i, (e) => toggleOption(e, i), false)
          ),
        ]}
        disabled={modeDisabled}
        forceClose={forceClose}
      >
        <IconButton
          img={simplified ? FilterListIcon : undefined}
          text={simplified ? undefined : `${checked.filter(Boolean).length} Selected`}
          width={simplified ? 2 : 10}
          onClick={() => {}}
          disabled={modeDisabled}
          balance={balance}
          corner={!balance}
          flatten={simplified ? undefined : 'right'}
          radius={radius ?? 0.45}
        />
      </Popover>
      {options.length > 1 && <VerticalToggle setModeSelected={setModeSelected} />}
      {!simplified && (
        <Tooltip content={tooltips?.[currentMode]} isDisabled={!tooltips?.[currentMode]}>
          <IconButton
            img={images[currentMode]}
            disabled={modeDisabled || !checked.includes(true)}
            onClick={handleTriggerClick}
            flatten={'left'}
            radius={radius ?? 0.45}
          />
        </Tooltip>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  width: 14vw;
  height: 2.5vw;
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

// modifies checkbox/radio color and size
const Row = styled.span<{ simplified?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.6vw;

  input[type='checkbox'],
  input[type='radio'] {
    width: 1vw;
    height: 1vw;
    cursor: pointer;
    accent-color: rgb(203, 186, 61);
  }
`;

const Image = styled.img`
  height: 2vw;
  width: 2vw;
  object-fit: cover;
  margin-left: auto;
  border-radius: 0.3vw;
  border: solid black 0.05vw;
`;
