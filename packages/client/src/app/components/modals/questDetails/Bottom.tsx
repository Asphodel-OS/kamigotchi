import styled from 'styled-components';

import { QuestsIcon } from 'assets/images/icons/menu';

const DEFAULT_BUTTONS = {
  AcceptButton: { label: '', onClick: () => {}, disabled: false, backgroundColor: '#f8f6e4' },
  CompleteButton: { label: '', onClick: () => {}, disabled: false, backgroundColor: '#f8f6e4' },
};

export const Bottom = ({
  color = '',
  buttons = DEFAULT_BUTTONS,
}: {
  color: string;
  buttons?: {
    AcceptButton: {
      label: string;
      onClick: () => void;
      disabled?: boolean;
      backgroundColor?: string;
    };
    CompleteButton: {
      label: string;
      onClick: () => void;
      disabled?: boolean;
      backgroundColor?: string;
    };
  };
}) => {
  const { CompleteButton, AcceptButton } = buttons;

  /////////////////
  // RENDER

  return (
    <Container color={color}>
      <NpcSprite src={QuestsIcon} />
      <Options>
        <Label color={color}>Options:</Label>
        <Option
          color={color}
          onClick={AcceptButton.onClick}
          disabled={AcceptButton.disabled}
          backgroundColor={AcceptButton.backgroundColor}
        >
          {AcceptButton.label}
        </Option>
        <Option
          color={color}
          onClick={CompleteButton.onClick}
          disabled={CompleteButton.disabled}
          backgroundColor={CompleteButton.backgroundColor}
        >
          {CompleteButton.label}
        </Option>
      </Options>
    </Container>
  );
};

const Container = styled.div<{ color: string }>`
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  border-top: solid grey 0.15em;
  height: 15vh;
  transition: height 0.3s ease;
  overflow-y: auto;
  ::-webkit-scrollbar {
    background: transparent;
    width: 0.3em;
  }
  ::-webkit-scrollbar-thumb {
    background-color: ${({ color }) => color};
    border-radius: 0.3em;
  }
`;

const NpcSprite = styled.img`
  filter: sepia(1);
  position: absolute;
  left: 0;
  width: auto;
  height: 100%;
  max-width: 40%;
  object-fit: contain;
  object-position: bottom left;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;

const Options = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  flex-flow: column;
  width: 100%;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 0.9em;
  padding-top: 1em;
  padding-right: 1em;
`;

const Label = styled.div<{ color?: string }>`
  font-size: 1em;
  margin-right: 41%;
  color: ${({ color }) => color};
`;

const Option = styled.button<{ color?: string; backgroundColor?: string }>`
  position: relative;
  ${({ color }) => color && `color: ${color};  border: solid ${color} 0.15em;`}
  padding: 0.2em 0.3em 0em 0.3em;
  font-size: 0.8em;
  z-index: 3;
  box-shadow: 0 0.1em 0.2em rgba(0, 0, 0, 1);
  cursor: pointer;
  width: 60%;
  border-radius: 0.3em;
  line-height: 1.3em;
  background-color: ${({ backgroundColor }) => backgroundColor};
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;
