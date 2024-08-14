import { EntityIndex, getComponentEntities, getComponentValue } from '@mud-classic/recs';
import { map, merge } from 'rxjs';
import styled, { keyframes } from 'styled-components';

import { registerUIComponent } from 'app/root';
import { Modals, useVisibility } from 'app/stores';

export function registerNotificationFixture() {
  registerUIComponent(
    'NotificationFixture',
    {
      colStart: 72,
      colEnd: 100,
      rowStart: 8,
      rowEnd: 30,
    },
    (layers) => {
      const {
        network: { notifications },
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
      const { fixtures, modals, setModals } = useVisibility();

      /////////////////
      // INTERACTION

      const handleClick = (targetModal: string | undefined) => {
        if (targetModal === undefined) return;

        const target = targetModal as keyof Modals;
        setModals({ ...modals, [target]: true });
      };

      /////////////////
      // VISUALIZATION

      const SingleNotif = (entityIndex: EntityIndex) => {
        const notification = getComponentValue(notifications.Notification, entityIndex);
        if (!notification) return null;

        return (
          <Card key={entityIndex.toString()}>
            <ExitButton onClick={() => notifications.remove(entityIndex)}>X</ExitButton>
            <div onClick={() => handleClick(notification.modal)}>
              <Title>{notification.title}</Title>
              <Description>{notification.description}</Description>
            </div>
          </Card>
        );
      };

      const isVisible = () => {
        return fixtures.notifications && list.length > 0;
      };

      /////////////////
      // RENDER

      return (
        <Wrapper style={{ display: isVisible() ? 'block' : 'none' }}>
          <Contents>{list.map((id) => SingleNotif(id))}</Contents>
        </Wrapper>
      );
    }
  );
}

const Wrapper = styled.div`
  margin: 0.2vw;
  display: block;
  overflow-y: scroll;
`;

const Contents = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  padding: 0.6vw;

  gap: 0.4vh 0.2vw;

  overflow: show;
`;

const Card = styled.div`
  position: relative;

  background-color: #fff;
  border: 0.2vw solid #333;
  border-radius: 0.8vw;
  padding: 0.7vh 1vw;
  width: 100%;
  opacity: 0.9;

  display: flex;
  flex-flow: column nowrap;

  &:hover {
    opacity: 1;
  }

  pointer-events: auto;
  cursor: pointer;
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

const ExitButton = styled.button`
  position: absolute;
  right: -0.6vw;
  top: -0.6vw;

  background-color: #ffffff;
  border: 0.15vw solid black;
  border-radius: 0.6vw;
  opacity: 0;

  color: black;
  padding: 0.3vw 0.4vw;

  font-size: 0.9vw;
  cursor: pointer;

  &:hover {
    background-color: #e8e8e8;
    opacity: 1;
    animation: ${() => fadeIn} 0.1s ease-in-out;
  }

  &:active {
    background-color: #c4c4c4;
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
