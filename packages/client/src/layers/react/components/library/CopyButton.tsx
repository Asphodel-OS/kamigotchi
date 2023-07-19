import { Snackbar, IconButton } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useState } from 'react'
import { dataStore } from 'layers/react/store/createStore';
import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';

interface Props {
  onClick: Function
};

// CopyButton provides visual and audio feedback to match common copy-button affordances.
// Unfortunately, it assumes any copied values are controlled by the parent component so
// does not handle the actual copying itself. Instead an onClick function is passed in.
export const CopyButton = (props: Props) => {
  const { sound: { volume } } = dataStore();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
    props.onClick();
    setOpen(true);
    // navigator.clipboard.writeText(window.location.toString())
  }

  return (
    <>
      <IconButton onClick={handleClick} size='small'>
        <ContentCopyIcon fontSize='small' style={{ color: '#666' }} />
      </IconButton>
      <Snackbar
        open={open}
        onClose={() => setOpen(false)}
        autoHideDuration={2000}
        message="Copied to clipboard"
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right"
        }}
      />
    </>
  )
}

export default CopyButton