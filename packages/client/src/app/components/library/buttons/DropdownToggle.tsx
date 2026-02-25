import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { Popover } from '../poppers';
import { Tooltip } from '../tooltips';
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
  selected,
  disabled = [],
  balance,
  radius = 0.45,
  simplified,
  limit,
  clearTrigger,
  trigger,
  hideActionButton,
  maxHeight,
  noSelectAll,
}: {
  onClick: ((selected: any[]) => void)[];
  button: {
    images: string[] | any;
    tooltips?: string[];
  };
  options: Option[][];
  selected?: any[][];
  disabled?: boolean[];
  balance?: number;
  radius?: number;
  simplified?: boolean;
  limit?: number;
  clearTrigger?: boolean;
  trigger?: React.ReactNode;
  hideActionButton?: boolean;
  maxHeight?: number;
  noSelectAll?: boolean;
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

  // sync checked state with options/selected
  useEffect(() => {
    if (selected?.[currentMode]) {
      const selectedForMode = selected[currentMode];
      setChecked(
        modeOptions.map((option) => selectedForMode.includes(option.object ?? option.text))
      );
      return;
    }

    if (checked.length !== modeOptions.length) {
      const initialChecked = Array(modeOptions.length).fill(false);
      setChecked(initialChecked);
      // if simplified, first option is selected by default
      if (simplified && modeOptions.length > 0) {
        setTimeout(() => {
          initialChecked[0] = true;
          setChecked(initialChecked);
          // onClick[currentMode]?.([modeOptions[0].object]);
        }, 1000);
      }
    }
  }, [modeOptions, selected, currentMode, checked.length, simplified]);

  // force close the popover if there are no options left
  // and the checklist is in the process of being emptied
  useEffect(() => {
    setForceClose(modeOptions.length === 0);
  }, [modeOptions]);

  // reset selection when clearTrigger is toggled externally
  useEffect(() => {
    if (clearTrigger !== undefined) {
      setChecked(Array(modeOptions.length).fill(false));
    }
  }, [clearTrigger]);

  const maxSelectable = Math.min(limit ?? modeOptions.length, modeOptions.length);
  const selectedCount = checked.filter(Boolean).length;
  const allSelected = selectedCount >= maxSelectable;

  const getSelectedObjects = (nextChecked = checked) =>
    modeOptions.filter((_, i) => nextChecked[i]).map((opt) => opt.object);

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
        const next = prev.map((val, i) => (i === index ? !val : val));
        if (hideActionButton) onClick[currentMode]?.(getSelectedObjects(next));
        return next;
      });
    }
  };

  /////////////////
  // INTERACTION

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent popover from closing
    // If all selected deselect all, else select up to the limit
    const next = checked.map((_, i) => !allSelected && i < maxSelectable);
    setChecked(next);
    if (hideActionButton) onClick[currentMode]?.(getSelectedObjects(next));
  };

  const handleTriggerClick = () => {
    playClick();
    onClick[currentMode]?.(getSelectedObjects());
  };

  /////////////////
  // DISPLAY

  const renderOption = ({ text, img, object }: Option, i: number, isSelectAll = false) => {
    const imageSrc = img ?? object?.image;
    const isChecked = isSelectAll ? allSelected : !!checked[i];
    const handleClick = isSelectAll
      ? (e: React.MouseEvent) => toggleAll(e)
      : (e: React.MouseEvent) => toggleOption(e, i);

    return (
      <MenuOption
        key={isSelectAll ? 'SelectAll' : `toggle-${i}`}
        onClick={handleClick}
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
            {isSelectAll && limit && selectedCount >= limit ? ` (max ${limit})` : ''}
          </span>
        </Row>
        {imageSrc && <Image src={imageSrc} />}
      </MenuOption>
    );
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Popover
        content={[
          ...(!simplified && !noSelectAll ? [renderOption({ text: 'Select All' }, 0, true)] : []),
          ...modeOptions.map((option, i) => renderOption(option, i)),
        ]}
        disabled={modeDisabled}
        forceClose={forceClose}
        maxHeight={maxHeight}
      >
        {trigger ?? (
          <IconButton
            img={simplified ? button.images[0] : undefined}
            text={simplified ? undefined : `${selectedCount} Selected`}
            width={simplified ? 2 : 10}
            onClick={() => {}}
            disabled={modeDisabled}
            balance={balance}
            corner={!balance}
            flatten={simplified ? undefined : 'right'}
            radius={radius ?? 0.45}
          />
        )}
      </Popover>
      {options.length > 1 && <VerticalToggle setModeSelected={setModeSelected} />}
      {!simplified && !hideActionButton && (
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
};

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
  font-size: 0.85vw;
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  padding: ${({ isSelectAll }) => (isSelectAll ? '0.5vw 0.6vw' : '0.3vw 0.6vw')};

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
