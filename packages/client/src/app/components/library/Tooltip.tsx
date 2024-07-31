import { default as MUITooltip } from '@mui/material/Tooltip';
import React from 'react';

interface Props {
  text: string[];
  children: React.ReactNode;
  grow?: boolean;
}

export const Tooltip = (props: Props) => {
  const { children, text } = props;
  const flexGrow = props.grow ? '1' : '0';
  const conjoinedText = text.join('\n');

  return (
    <MUITooltip
      title={conjoinedText}
      enterDelay={1000}
      leaveTouchDelay={0}
      style={{
        flexGrow: flexGrow,
        display: 'flex',
        cursor: 'help',
        flexDirection: 'column',
      }}
      componentsProps={{
        tooltip: {
          sx: {
            zIndex: '3',
            border: 'solid black .15vw',
            borderRadius: '0.6vw',
            opacity: '0.1',
            padding: '.6vw',

            color: 'black',
            textShadow: '0 0 0.3vw white',

            fontSize: '.7vw',
            fontFamily: 'Pixel',
            lineHeight: '1vw',
            whiteSpace: 'pre-line',
          },
        },
      }}
    >
      <span>{children}</span>
    </MUITooltip>
  );
};
