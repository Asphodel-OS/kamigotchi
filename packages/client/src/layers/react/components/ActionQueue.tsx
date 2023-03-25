import React, { useEffect, useState } from 'react';
import {
  getComponentEntities,
  getComponentValueStrict,
} from '@latticexyz/recs';
import { map } from 'rxjs';
import { ActionStateString, ActionState } from '@latticexyz/std-client';
import { registerUIComponent } from 'layers/react/engine/store';
import styled from 'styled-components';

// Color coding of action queue
type ColorMapping = { [key: string]: string };
const statusColors: ColorMapping = {
  "pending": "orange",
  "failed": "red",
  "complete": "green",
}

export function registerActionQueue() {
  registerUIComponent(
    'ActionQueue',
    {
      rowStart: 5,
      rowEnd: 50,
      colStart: 80,
      colEnd: 99,
    },
    (layers) => {
      const {
        network: {
          actions: { Action },
        },
      } = layers;

      return Action.update$.pipe(
        map(() => ({
          Action,
        }))
      );
    },
    ({ Action }) => {

      const StyledStatus = (status: string) => {
        const text = status.toLowerCase();
        const color = statusColors[text];
        return (
          <Description style={{ color: `${color}`, display: "inline" }}>
            {text}
          </Description>
        );
      }

      return (
        <ModalWrapper>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Description>TX Queue:</Description>
            {[...getComponentEntities(Action)].map((e) => {
              const actionData = getComponentValueStrict(Action, e);
              let state = ActionStateString[actionData.state as ActionState];
              if (state == "WaitingForTxEvents") state = "Pending";
              return (
                <Description key={`action${e}`}>
                  {Action.world.entities[e]}: {StyledStatus(state)}
                </Description>
              );
            })}
          </ModalContent>
        </ModalWrapper>
      );
    }
  );
}

const ModalWrapper = styled.div`
  display: grid;
  align-items: left;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 20px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;

  overflow: scroll;
  max-height: 300px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #333;
  text-align: left;
  padding: 2px;
  font-family: Pixel;
`;
