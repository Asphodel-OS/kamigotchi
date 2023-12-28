import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { Listings } from './Listings';
import { MusuRow } from './MusuRow';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Merchant, getMerchantByIndex } from 'layers/react/shapes/Merchant';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelected } from 'layers/react/store/selected';


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

    // Requirement (Data Manangement)
    (layers) => {
      const {
        network: {
          components: {
            AccountID,
            Coin,
            Description,
            IsListing,
            IsNPC,
            ItemIndex,
            NPCIndex,
            Location,
            Name,
          },
        },
      } = layers;

      return merge(
        AccountID.update$,
        Coin.update$,
        Description.update$,
        IsListing.update$,
        IsNPC.update$,
        ItemIndex.update$,
        NPCIndex.update$,
        Location.update$,
        Name.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(layers, { inventory: true });
          const { npcIndex } = useSelected.getState();
          const merchant = getMerchantByIndex(layers, npcIndex);

          return {
            layers,
            data: {
              account,
              merchant,
            } as any,
          };
        })
      );
    },

    // Render
    ({ layers, data }) => {
      // console.log('mMerchant: data', data);
      const { npcIndex } = useSelected();
      const [merchant, setMerchant] = useState<Merchant>(data.merchant);

      // updates from component subscription updates
      useEffect(() => {
        setMerchant(data.merchant);
      }, [data.merchant]);

      // updates from selected Merchant updates
      useEffect(() => {
        setMerchant(getMerchantByIndex(layers, npcIndex));
      }, [npcIndex]);


      /////////////////
      // DISPLAY

      return (
        <ModalWrapperFull
          id='merchant'
          divName='merchant'
          header={<Title>{`${merchant?.name}'s Shop`}</Title>}
          footer={<MusuRow key='musu' balance={data.account.coin} />}
          canExit
        >
          <Listings listings={merchant?.listings} />
        </ModalWrapperFull>
      );
    })
}


const Title = styled.div`
  width: 100%;
  padding: 2vw;

  color: black;
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;