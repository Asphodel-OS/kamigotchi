import styled from 'styled-components';

import { AccountCard, ActionListButton } from 'app/components/library';
import { BaseAccount } from 'network/shapes/Account';

interface Props {
  isVisible: boolean;
  accounts: BaseAccount[];
  actions: {
    blockFren: (account: BaseAccount) => void;
    requestFren: (account: BaseAccount) => void;
  };
}

export const Searched = (props: Props) => {
  const { accounts, actions, isVisible } = props;

  const Actions = (account: BaseAccount) => {
    return (
      <ActionListButton
        id={`options-${account.entity}`}
        text=''
        options={[
          { text: 'Add', onClick: () => actions.requestFren(account) },
          { text: 'Block', onClick: () => actions.blockFren(account) },
        ]}
      />
    );
  };

  // inbound list of pending friend requests
  if (accounts.length === 0 && isVisible) return <EmptyText>no matching results</EmptyText>;

  return (
    <Container isVisible={isVisible}>
      {accounts.map((account) => (
        <AccountCard
          key={account.index}
          account={account}
          description={[`free agent ${account.index}`]}
          actions={Actions(account)}
        />
      ))}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  width: 100%;
  gap: 0.6vw;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

const EmptyText = styled.div`
  color: black;
  margin: 1vw;

  display: flex;
  justify-content: center;
  align-items: center;

  font-size: 0.9vw;
  font-family: Pixel;
`;
