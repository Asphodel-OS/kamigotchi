/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState, useCallback } from 'react';
import { map } from 'rxjs';
import { registerUIComponent } from 'layers/react/engine/store';
import styled, { keyframes } from 'styled-components';
import { HasValue, runQuery } from '@latticexyz/recs';
import mintSound from 'assets/sound/fx/tami_mint_vending_sound.mp3'
import { dataStore } from 'layers/react/store/createStore';

export function regiesterDetectAccountModal() {
  registerUIComponent(
    'DetectMint',
    {
      colStart: 40,
      colEnd: 60,
      rowStart: 40,
      rowEnd: 60,
    },
    (layers) => {
      const {
        network: {
          components: { OperatorAddress },
        },
      } = layers;

      return OperatorAddress.update$.pipe(
        map(() => {
          return {
            layers,
          };
        })
      );
    },

    ({ layers }) => {
      const {
        network: {
          components: { OperatorAddress },
          api: { player },
          network: { connectedAddress },
        },
      } = layers;

      const [isDivVisible, setIsDivVisible] = useState(false);
      const [name, setName] = useState("");
      const { volume } = dataStore((state) => state.sound);

      const hasAccount = Array.from(
        runQuery([HasValue(OperatorAddress, { value: connectedAddress.get() })])
      )[0];

      const handleMinting = useCallback(
        async (name) => {
          try {
            const mintFX = new Audio(mintSound)

            mintFX.volume = volume;
            mintFX.play()

            await player.account.set(connectedAddress.get()!, name);

            document.getElementById('detectAccount')!.style.display = 'none';
            document.getElementById('mint_process')!.style.display = 'block';
          } catch (e) {
            //
          }
        }, []
      );

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          handleMinting(name);
        }
        // if (event.keyCode === 27) {}
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
      };

      useEffect(() => {
        if (hasAccount != undefined) return setIsDivVisible(false);
        return setIsDivVisible(true);
      }, [setIsDivVisible, hasAccount]);

      return (
        <ModalWrapper
          id="detectAccount"
          style={{ display: isDivVisible ? 'block' : 'none' }}
        >
          <ModalContent>
            <Description style={{ gridRow: 1 }}>
              Your Name
            </Description>
            <Input style={{ gridRow: 2, pointerEvents: 'auto' }}
              type="text"
              onKeyDown={(e) => catchKeys(e)}
              placeholder="username"
              value={name}
              onChange={(e) => handleChange(e)}>
            </Input>
          </ModalContent>
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

const Input = styled.input`
  width: 100%;

  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px 12px;

  text-align: left;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
`

const ModalWrapper = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 1.3s ease-in-out;
`;

const ModalContent = styled.div`
  display: grid;
  justify-content: center;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 20px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
`;

const Description = styled.p`
  font-size: 18px;
  color: #333;
  text-align: center;
  padding: 20px;
  font-family: Pixel;
`;
