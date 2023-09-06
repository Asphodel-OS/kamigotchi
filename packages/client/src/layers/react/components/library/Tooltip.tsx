import React from 'react';
import styled from 'styled-components';
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

  return <MUITooltip
    title={conjoinedText}
    enterDelay={100}
    style={{
      flexGrow: flexGrow,
      display: 'flex',
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
      }
    }}
  >
    <span>{children}</span>
  </MUITooltip>;
}

