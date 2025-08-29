import { EntityID, EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Text } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Kill } from 'clients/kamiden';
import { Account, Kami } from 'network/shapes';
import { playClick } from 'utils/sounds';

export const OwnerColumn = ({
  kills,
  utils,
}: {
  kills: Kill[];
  utils: {
    getKamiByID: (id: EntityID) => Kami;
    getAccountByID: (id: EntityID) => Account;
    getOwner: (entity: EntityIndex) => Account;
  };
}) => {
  const { getAccountByID, getKamiByID, getOwner } = utils;
  const accountIndex = useSelected((s) => s.accountIndex);
  const setAccount = useSelected((s) => s.setAccount);
  const { modals, setModals } = useVisibility();

  const selectAccount = (index: number) => {
    if (!modals.account) {
      setModals({ account: true, map: false, party: false });
    } else if (accountIndex === index) {
      setModals({ account: false });
    }
    setAccount(index);
    playClick();
  };

  return (
    <Container>
      <Text size={1.2}>Owner</Text>
      {kills.map((kill, index) => {
        const adversaryId = kill.IsDeath ? kill.KillerId : kill.VictimId;
        const adversary = getKamiByID(adversaryId as EntityID);
        const account = getOwner(adversary.entity);
        return (
          <Row key={index} onClick={() => selectAccount(account.index)}>
            <Text size={0.9}>{account.name}</Text>
          </Row>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  gap: 0.3vw;

  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: flex-start;

  overflow-x: hidden;
`;

const Row = styled.div`
  width: 100%;
  height: 2.1vw;
  gap: 0.45vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;

  &:hover {
    cursor: pointer;
    opacity: 0.8;
  }
`;
