import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected } from 'app/stores';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { Merchant, getMerchantByIndex } from 'layers/network/shapes/Merchant';
import { Listings } from './Listings';
import { MusuRow } from './MusuRow';

// merchant window with listings. assumes at most 1 merchant per room
export function registerMerchantModal() {
  registerUIComponent(
    'MerchantWindow',

    // Grid Config
    {
      colStart: 30,
      colEnd: 70,
      rowStart: 20,
      rowEnd: 70,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const { npcIndex } = useSelected.getState();
          const account = getAccountFromBurner(network, { inventory: true });
          const merchant = getMerchantByIndex(world, components, npcIndex);

          return {
            network,
            data: { account, merchant },
          };
        })
      ),

    // Render
    ({ network, data }) => {
      // console.log('mMerchant: data', data);
      const { world, components } = network;
      const { npcIndex } = useSelected();
      const [merchant, setMerchant] = useState<Merchant>(data.merchant);

      // updates from component subscription updates
      useEffect(() => {
        setMerchant(data.merchant);
      }, [data.merchant]);

      // updates from selected Merchant updates
      useEffect(() => {
        setMerchant(getMerchantByIndex(world, components, npcIndex));
      }, [npcIndex]);

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper
          id='merchant'
          header={<Title>{`${merchant?.name}'s Shop`}</Title>}
          footer={<MusuRow key='musu' balance={data.account.coin} />}
          canExit
        >
          <Listings listings={merchant?.listings} />
        </ModalWrapper>
      );
    }
  );
}

const Title = styled.div`
  width: 100%;
  padding: 2vw;

  color: black;
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;
