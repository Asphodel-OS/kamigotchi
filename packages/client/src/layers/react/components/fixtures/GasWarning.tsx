/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useBalance } from 'wagmi';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import { useKamiAccount } from 'layers/react/store/kamiAccount';

// preset operator fund that allows users to choose how much to fund, but suggests a good number
// tell users how many transactions / how long this balance will last
export function registerGasWarningFixture() {
  registerUIComponent(
    'GasWarning',
    {
      colStart: 78,
      colEnd: 100,
      rowStart: 80,
      rowEnd: 99,
    },
    (layers) => of(layers),

    () => {
      const { details: accountDetails } = useKamiAccount();
      const { visibleModals, setVisibleModals } = dataStore();
      const [isVisible, setIsVisible] = useState(false);
      const minGas = 0.005;

      /////////////////
      // BALANCES

      const { data: OperatorBal } = useBalance({
        address: accountDetails.operatorAddress as `0x${string}`,
        watch: true
      });

      useEffect(() => {
        setIsVisible(Number(OperatorBal?.formatted) < minGas);
      }, [OperatorBal]);

      const openFundModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, operatorFund: true, });
      }, [setVisibleModals, visibleModals]);

      return (
        <ModalWrapper id='operatorFundPreset' style={{ display: isVisible ? 'block' : 'none' }}>
          <Content>
            <Header>Low operator gas</Header>
            <Body>The connected operator has less than 0.005 eth in gas left. Consider topping up.</Body>
            <ActionButton
              id='button-deposit'
              onClick={openFundModal}
              size='medium'
              text='add gas'
            />
          </Content>
        </ModalWrapper>
      );
    }
  );
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const ModalWrapper = styled.div`
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 1.3s ease-in-out;
`;

const Content = styled.div`
  border-color: black;
  border-width: .15vw;
  border-radius: 10px;
  border-style: solid;
  background-color: white;
  padding: 1.1vw;
  width: 99%;
  height: 99%;
  
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: column nowrap;
  font-family: Pixel;
`;

const Header = styled.p`
  font-size: 1.2vw;
  color: black;
  text-align: center;
  font-family: Pixel;
  padding: .3vw .2vw;
`;

const Body = styled.p`
  color: black;
  justify-content: center;
  padding: .7vw .2vw;
  font-family: Pixel;
  font-size: .8vw;
  text-align: left;
  text-decoration: none;
`;


