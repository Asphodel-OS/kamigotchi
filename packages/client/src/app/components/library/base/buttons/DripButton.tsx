import { Snackbar, SnackbarContent } from '@mui/material';
import { useNetwork } from 'app/stores';
import React, { useState } from 'react';
import { dripEth } from 'utils/faucet';
import { ActionButton } from '..';

export const DripButton = React.memo(() => {
  const { selectedAddress } = useNetwork.getState();
  const [error, setError] = useState({ currentState: false, message: '' });
  const [showModal, setShowModal] = useState(false);

  const handleClickOpen = () => {
    dripEth(selectedAddress, setError);
    setShowModal(true);
  };
  return (
    <>
      <ActionButton
        text=' Drip Eth'
        disabled={error.currentState}
        onClick={() => handleClickOpen()}
        size='vending'
      />
      <Snackbar
        open={showModal}
        onClose={() => setShowModal(false)}
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
            borderRadius: '0.6vw',
            padding: '0.6vw',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          message={error.message}
        />
      </Snackbar>
    </>
  );
});
