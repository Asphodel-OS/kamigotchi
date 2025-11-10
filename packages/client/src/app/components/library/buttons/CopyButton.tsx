import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { IconButton, Snackbar, SnackbarContent } from '@mui/material';
import { useState } from 'react';

import { playClick } from 'utils/sounds';

// CopyButton provides visual and audio feedback to match common copy-button affordances.
// Unfortunately, it assumes any copied values are controlled by the parent component so
// does not handle the actual copying itself. Instead an onClick function is passed in.
export const CopyButton = ({
  text,
}: {
  text: string;
}) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    playClick();
    navigator.clipboard.writeText(text);
    setOpen(true);
  };

  return (
    <>
      <IconButton onClick={handleClick} size='small'>
        <ContentCopyIcon fontSize='small' style={{ color: '#666' }} />
      </IconButton>
      <Snackbar
        open={open}
        onClose={() => setOpen(false)}
        autoHideDuration={2000}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <SnackbarContent
          style={{
            backgroundColor: '#fff',
            color: '#333',
            borderRadius: '0.6em',
            padding: '0.6em',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          message='Copied to clipboard'
        />
      </Snackbar>
    </>
  );
};

export default CopyButton;
