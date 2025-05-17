import { EntityID } from '@mud-classic/recs';
import styled from 'styled-components';

import { IconButton, KamiBlock, Text, Tooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { Inventory } from 'network/shapes/Inventory';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';
import { playScribble } from 'utils/sounds';

const MIN_LEN = 1;
const MAX_LEN = 16;
const ONYX_PRICE = 5; // rename price in onyx

interface Props {
  actions: {
    onyxApprove: (price: number) => EntityID | void;
    onyxRename: (kami: Kami, name: string) => EntityID;
    rename: (kami: Kami, name: string) => EntityID;
  };
  data: {
    account: Account;
    kami: Kami;
    holyDustItem: Item;
    onyxItem: Item;
    onyxInfo: {
      allowance: number;
      balance: number;
    };
  };
  state: {
    tick: number;
  };
  utils: {
    getItemBalance: (inventory: Inventory[], index: number) => number;
  };
}

// TODO: check action status, prevent duplicate spend and update names properly on cache
export const Stage = (props: Props) => {
  const { actions, data, state, utils } = props;
  const { onyxApprove, onyxRename, rename } = actions;
  const { account, kami, onyxInfo, onyxItem, holyDustItem } = data;
  const { tick } = state;
  const { getItemBalance } = utils;
  const { modals } = useVisibility();

  const [holyBalance, setHolyBalance] = useState(0);
  const [name, setName] = useState('');

  useEffect(() => {
    const holyIndex = holyDustItem.index;
    const holyBalance = getItemBalance(account.inventories ?? [], holyIndex);
    setHolyBalance(holyBalance);
  }, [tick]);

  useEffect(() => {
    if (!modals.emaBoard) return;
    if (kami.index === 0 || modals.emaBoard) setName('');
  }, [kami.index, modals.emaBoard]);

  /////////////////
  // INTERPRETATION

  const isHolyDisabled = () => {
    if (kami.index === 0) return true;
    if (holyBalance == 0) return true;
    if (name.length < MIN_LEN) return true;
    return false;
  };

  const isOnyxDisabled = () => {
    if (kami.index === 0) return true;
    if (onyxInfo.balance < ONYX_PRICE) return true;
    if (name.length < MIN_LEN) return true;
    return false;
  };

  const getHolyTooltip = () => {
    if (kami.index === 0) return ['you must select a kami'];

    const index = holyDustItem.index;
    const balance = getItemBalance(account.inventories ?? [], index);
    if (balance == 0) return ['you have no holy dust'];
    if (name.length < MIN_LEN) return ['you need to choose a name'];
    return [`rename ${kami.name}`, `with 1 ${holyDustItem.name}`];
  };

  const getOnyxTooltip = () => {
    if (kami.index === 0) return ['you must select a kami'];

    const balance = onyxInfo.balance;
    if (onyxInfo.balance < ONYX_PRICE) return [`you need more ${ONYX_PRICE - balance} $ONYX`];
    if (onyxInfo.allowance < ONYX_PRICE) return [`approve spend of ${ONYX_PRICE} $ONYX`];
    if (name.length < MIN_LEN) return ['you need to choose a name'];
    return [`rename ${kami.name}`, `with ${ONYX_PRICE} $${onyxItem.name}`];
  };

  /////////////////
  // INTERACTION

  // handle the spend allowance increase or renaming of a kami with onyx
  // TODO: play sound on success confirmation
  const handleOnyxClick = () => {
    if (onyxInfo.allowance < ONYX_PRICE) onyxApprove(ONYX_PRICE);
    else {
      playScribble();
      const actionID = onyxRename(kami, name);
    }
  };

  // handle the renaming of a kami with holy dust
  // TODO: play sound on success confirmation
  const handleHolyClick = () => {
    playScribble();
    const actionID = rename(kami, name);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;
    if (MAX_LEN && value.length > MAX_LEN) value = value.slice(0, MAX_LEN);
    setName(value);
  };

  return (
    <Container>
      <Text size={1.5}>Rename {kami.name}</Text>
      <Text size={0.9}>Choose wisely.</Text>
      <Row>
        <Tooltip text={getHolyTooltip()}>
          <IconButton
            img={holyDustItem.image}
            scale={3.3}
            onClick={handleHolyClick}
            disabled={isHolyDisabled()}
            shadow
          />
        </Tooltip>
        <KamiBlock kami={kami} />
        <Tooltip text={getOnyxTooltip()}>
          <IconButton
            img={onyxItem.image}
            scale={3.3}
            onClick={handleOnyxClick}
            disabled={isOnyxDisabled()}
            shadow
          />
        </Tooltip>
      </Row>
      <Input
        type='text'
        value={name}
        placeholder={kami.name === '' ? 'select a kami' : kami.name}
        onChange={(e) => handleChange(e)}
      />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  margin: 0.9vw;
  background-color: #fff;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  user-select: none;
`;

const Input = styled.input`
  border: solid 0.15vw black;
  border-radius: 0.45vw;

  width: 18vw;
  padding: 0.75vw 1vw;

  font-size: 0.75vw;
  text-align: center;
  text-decoration: none;

  justify-content: center;
  align-items: center;
`;

const Row = styled.div`
  width: 90%;
  padding-top: 0.6vw;
  gap: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
`;
