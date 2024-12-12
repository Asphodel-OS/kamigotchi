import { AccountCard, ActionListButton } from 'app/components/library';
import { BaseAccount } from 'network/shapes/Account';
import styled from 'styled-components';

interface Props {
  accounts: BaseAccount[];
  actions: {
    blockFren: (account: BaseAccount) => void;
    requestFren: (account: BaseAccount) => void;
  };
}

export const Searched = (props: Props) => {
  const { accounts, actions } = props;

  const Actions = (account: BaseAccount) => {
    return (
      <ActionListButton
        id={`options-${account.entityIndex}`}
        text=''
        options={[
          { text: 'Add', onClick: () => actions.requestFren(account) },
          { text: 'Block', onClick: () => actions.blockFren(account) },
        ]}
      />
    );
  };

  // inbound list of pending friend requests
  if (accounts.length === 0) return <EmptyText>no matching results</EmptyText>;

  return (
    <Container>
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

const Container = styled.div`
  width: 100%;
  display: flex;
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
