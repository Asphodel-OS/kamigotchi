import { EntityID } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { IconButton, KamiBlock, Text, TextTooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { Inventory } from 'network/shapes/Inventory';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { playScribble } from 'utils/sounds';

const MIN_LEN = 1;
const MAX_LEN = 16;

// TODO: check action status, prevent duplicate spend and update names properly on cache
export const Stage = ({
  actions,
  data,
  state,
  utils,
}: {
  actions: {
    rename: (kami: Kami, name: string) => EntityID;
  };
  data: {
    account: Account;
    kami: Kami;
    holyDustItem: Item;
  };
  state: {
    tick: number;
  };
  utils: {
    getItemBalance: (inventory: Inventory[], index: number) => number;
  };
}) => {
  const { rename } = actions;
  const { account, kami, holyDustItem } = data;
  const { tick } = state;
  const { getItemBalance } = utils;
  const emaBoardVisible = useVisibility((s) => s.modals.emaBoard);

  const [holyBalance, setHolyBalance] = useState(0);
  const [name, setName] = useState('');

  useEffect(() => {
    const holyIndex = holyDustItem.index;
    const holyBalance = getItemBalance(account.inventories ?? [], holyIndex);
    setHolyBalance(holyBalance);
  }, [tick]);

  useEffect(() => {
    if (!emaBoardVisible) return;
    if (kami.index === 0 || emaBoardVisible) setName('');
  }, [kami.index, emaBoardVisible]);

  /////////////////
  // INTERPRETATION

  const isHolyDisabled = () => {
    if (kami.index === 0) return true;
    if (holyBalance == 0) return true;
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

  /////////////////
  // INTERACTION

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
        <KamiBlock kami={kami} />
      </Row>
      <Row>
        <Input
          type='text'
          value={name}
          placeholder={kami.name === '' ? 'select a kami' : kami.name}
          onChange={(e) => handleChange(e)}
        />
        <TextTooltip text={getHolyTooltip()}>
          <IconButton
            img={holyDustItem.image}
            scale={2.6}
            onClick={handleHolyClick}
            disabled={isHolyDisabled()}
            shadow
          />
        </TextTooltip>
      </Row>
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
  position: relative;
  width: 90%;
  padding-top: 0.6vw;
  gap: 0.3vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
`;
