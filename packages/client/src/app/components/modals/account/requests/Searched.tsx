import styled from 'styled-components';

import { AccountCard, ActionListButton, EmptyText } from 'app/components/library';
import { BaseAccount } from 'network/shapes/Account';

export const Searched = ({
  isVisible,
  accounts,
  actions,
}: {
  isVisible: boolean;
  accounts: BaseAccount[];
  actions: {
    blockFren: (account: BaseAccount) => void;
    requestFren: (account: BaseAccount) => void;
  };
}) => {
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

  return (
    <Container isVisible={isVisible}>
      {accounts.length === 0 ? (
        <EmptyText text={['no matching results']} />
      ) : (
        accounts.map((account) => (
          <AccountCard
            key={account.index}
            account={account}
            description={[`free agent ${account.index}`]}
            actions={Actions(account)}
          />
        ))
      )}
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
