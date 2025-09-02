import { EntityIndex, getComponentEntities, getComponentValue } from '@mud-classic/recs';
import styled, { keyframes } from 'styled-components';

import { UIComponent } from 'app/root/types';
import { useLayers } from 'app/root/hooks';
import { Modals, useVisibility } from 'app/stores';

export const NotificationFixture: UIComponent = {
  id: 'NotificationFixture',
  Render: () => {
    const layers = useLayers();
    
    const {
      notifications,
      list,
    } = (() => {
      const {
        network: { notifications },
      } = layers;
      const list = Array.from(getComponentEntities(notifications.Notification));
      return {
        notifications: notifications,
        list: list,
      };
    })();

      const { fixtures, modals, setModals } = useVisibility();

      /////////////////
      // INTERACTION

      const handleClick = (targetModal: string | undefined, entity: EntityIndex) => {
        if (targetModal === undefined) return;

        const target = targetModal as keyof Modals;
        setModals({ [target]: true });
        dismiss(entity);
      };

      const dismiss = (entity: EntityIndex) => {
        notifications.remove(entity);
      };

      /////////////////
      // VISUALIZATION

      const SingleNotif = (entity: EntityIndex) => {
        const notification = getComponentValue(notifications.Notification, entity);
        if (!notification) return null;

        return (
          <Card key={entity.toString()}>
            <ExitButton onClick={() => dismiss(entity)}>X</ExitButton>
            <div onClick={() => handleClick(notification.modal as string | undefined, entity)}>
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
          <Contents>{list.map((id: EntityIndex) => SingleNotif(id))}</Contents>
        </Wrapper>
      );
  },
};

const Wrapper = styled.div`
  justify-self: end;
  min-width: 30rem;

  display: block;
  height: 100%;
  overflow-y: auto;
`;

const Contents = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;

  gap: 0.4em 0.2em;
`;

const Card = styled.div`
  position: relative;

  background-color: #fff;
  border: 0.2em solid #333;
  border-radius: 0.8em;
  padding: 0.7em 1em;
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
  font-size: 1em;
  text-align: left;
  text-wrap: wrap;
  justify-content: flex-start;
  color: #333;
  padding: 1em 0.5em 0 0.5em;

  max-width: 100%;
`;

const Description = styled.div`
  color: #333;

  font-family: Pixel;
  text-align: left;
  text-wrap: wrap;
  line-height: 1.2em;
  font-size: 0.7em;
  padding: 0.4em 0.5em;

  max-width: 100%;
`;

const ExitButton = styled.button`
  position: absolute;
  right: -0.6em;
  top: -0.6em;

  background-color: #ffffff;
  border: 0.15em solid black;
  border-radius: 0.6em;
  opacity: 0;

  color: black;
  padding: 0.3em 0.4em;

  font-size: 0.9em;
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
