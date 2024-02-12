import React from 'react';
import { default as MUITooltip } from '@mui/material/Tooltip';

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
      followCursor
      enterDelay={500}
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
            zIndex: '2',
            borderStyle: 'solid',
            borderWidth: '.15vw',
            borderColor: 'black',
            backgroundColor: '#fff',
            padding: '10px',

            color: 'black',
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
