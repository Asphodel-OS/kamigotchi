import { Snackbar, SnackbarContent } from '@mui/material';
import { useNetwork } from 'app/stores';
import React, { useEffect, useState } from 'react';
import { dripEth } from 'utils/faucet';
import { ActionButton } from '..';

export const DripButton = React.memo(() => {
  const { selectedAddress } = useNetwork.getState();
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');

  const handleClickOpen = () => {
    dripEth(selectedAddress, setError);
    setShowModal(true);
  };

  useEffect(() => {
    error ? setMessage(error) : setMessage('Succeeded!');
  }, [showModal]);

  return (
    <>
      <ActionButton
        text=' Drip Eth'
        disabled={error !== null}
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
          message={message}
        />
      </Snackbar>
    </>
  );
});
