import { EntityIndex, getComponentValue, getComponentEntities } from '@latticexyz/recs';
import React from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { registerUIComponent } from 'layers/react/engine/store';
import { Modals, useComponentSettings } from 'layers/react/store/componentSettings';
import 'layers/react/styles/font.css';

export function registerNotificationFixture() {
  registerUIComponent(
    'NotificationFixture',
    {
      colStart: 72,
      colEnd: 99,
      rowStart: 8,
      rowEnd: 30,
    },
    (layers) => {
      const {
        network: {
          notifications,
        },
      } = layers;

      return merge(notifications.Notification.update$).pipe(
        map(() => {
          const list = Array.from(getComponentEntities(notifications.Notification));
          return {
            notifications: notifications,
            list: list,
          };
        })
      );
    },

    ({ notifications, list }) => {

      const { modals, setModals } = useComponentSettings();

      const handleClick = (targetModal: string | undefined) => {
        if (targetModal === undefined) return;

        const target = targetModal as keyof Modals;
        setModals({ ...modals, [target]: true });
      }

      const SingleNotif = (id: EntityIndex) => {
        const notification = getComponentValue(notifications.Notification, id);
        if (!notification) return null;

        return (
          <Card
            key={id.toString()}
            onClick={() => handleClick(notification.modal)}
          >
            <Title>{notification.title}</Title>
            <Description>{notification.description}</Description>
          </Card>
        );
      }

      return (
        <Wrapper>
          <Scrollable>
            {list.map((id) => (SingleNotif(id)))}
          </Scrollable>
        </Wrapper >
      );
    }
  );
}

const Wrapper = styled.div`
  display: block;
  align-items: left;
  pointer-events: auto;

  width: 100%;
`;

const Card = styled.button`
  background-color: #fff;
  border-color: black;
  border-radius: 10px;
  border-style: solid;
  border-width: 2px;
  color: black;
  padding: 0.7vh 0.7vw;
  margin: 0 0 1vh 0;
  width: 100%;

  display: flex;
  flex-flow: column;

  &:hover {
    opacity: 0.8;
  }
`;

const Description = styled.div`
  color: #333;

  font-family: Pixel;
  text-align: left;
  text-wrap: wrap;
  line-height: 1.2vw;
  font-size: 0.7vw;
  padding: 0.4vh 0.5vw;

  max-width: 100%;
`;

const Scrollable = styled.div`
  overflow-y: scroll;
  height: 100%;
  max-height: 100%;
  padding: 1vw;
`;

const Title = styled.p`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  text-wrap: wrap;
  justify-content: flex-start;
  color: #333;
  padding: 1vh 0.5vw 0 0.5vw;

  max-width: 100%;
`;