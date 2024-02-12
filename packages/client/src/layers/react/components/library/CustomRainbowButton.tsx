import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ActionButton } from 'layers/react/components/library/ActionButton';

/*
 * Modifies rainbowkit's ConnectButton to be use ActionButton instead
 * copies some props from action button to allow pass through
 */

interface Props {
  size: 'small' | 'medium' | 'large' | 'vending' | 'menu';
  disabled?: boolean;
  fill?: boolean;
  inverted?: boolean;
}

export const AccountButton = (props: Props) => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <ActionButton
                    id='connect-button'
                    onClick={openConnectModal}
                    text='Connect Wallet'
                    size={props.size}
                    disabled={props.disabled}
                    fill={props.fill}
                    inverted={props.inverted}
                  />
                );
              }

              if (chain.unsupported) {
                return (
                  <ActionButton
                    id='unsupported-chain-button'
                    onClick={openChainModal}
                    text='Wrong Chain'
                    size={props.size}
                    disabled={props.disabled}
                    fill={props.fill}
                    inverted={props.inverted}
                  />
                );
              }

              return (
                <div style={{ display: 'flex' }}>
                  <ActionButton
                    id='chain-button'
                    onClick={openAccountModal}
                    text={
                      account.address.substring(0, 4) +
                      '...' +
                      account.address.substring(38, 42)
                    }
                    size={props.size}
                    disabled={props.disabled}
                    fill={props.fill}
                    inverted={props.inverted}
                  />
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
