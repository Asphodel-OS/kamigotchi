import { default as MUITooltip } from '@mui/material/Tooltip';
import React from 'react';

interface Props {
  text: string[];
  children: React.ReactNode;
  grow?: boolean;
  direction?: 'row' | 'column';
  align?: 'left' | 'right' | 'center';
}

export const Tooltip = (props: Props) => {
  const { children, text, direction } = props;
  const conjoinedText = text.join('\n');
  const flexGrow = props.grow ? '1' : '0';
  const align = props.align ?? 'left';

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
        flexDirection: direction ?? 'column',
      }}
      componentsProps={{
        tooltip: {
          sx: {
            zIndex: '2',
            borderStyle: 'solid',
            borderWidth: '.15vw',
            borderColor: 'black',
            backgroundColor: '#fff',
            borderRadius: '0.6vw',
            padding: '0.9vw',
            maxWidth: '36vw',

            color: 'black',
            fontSize: '.7vw',
            fontFamily: 'Pixel',
            lineHeight: '1.25vw',
            whiteSpace: 'pre-line',
            textAlign: align,
          },
        },
      }}
    >
      <span>{children}</span>
    </MUITooltip>
  );
};
