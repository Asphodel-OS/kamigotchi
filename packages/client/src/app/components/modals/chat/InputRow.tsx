import { useState } from 'react';
import styled from 'styled-components';

import { EntityID, EntityIndex, World } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { ActionSystem } from 'network/systems';
import { waitForActionCompletion } from 'network/utils';
import { playMessage } from 'utils/sounds';

export const InputRow = ({
  actionSystem,
  api,
  world,
}: {
  actionSystem: ActionSystem;
  api: any;
  world: World;
}) => {
  const [text, setText] = useState('');
  const [textLength, setTextLength] = useState(0);
  const [sending, setSending] = useState(false);

  /////////////////
  // INTERACTION

  const onSubmit = (text: string) => {
    playMessage();
    // TODO: play success sound and update message in feed here
    const actionID = uuid() as EntityID;
    actionSystem!.add({
      id: actionID,
      action: 'SendMessage',
      params: [text],
      description: `Send Message`,
      execute: async () => {
        return api.player.account.chat.send(text);
      },
    });
    return actionID;
  };

  const handleSubmit = async (text: string) => {
    if (text.trim().length === 0) return;
    try {
      setSending(true);
      const actionID = onSubmit(text);
      if (!actionID) {
        setSending(false);
        throw new Error('Sending message action failed');
      }
      await waitForActionCompletion(
        actionSystem!.Action,
        world.entityToIndex.get(actionID) as EntityIndex
      );
      setText('');
      setTextLength(0);
      setSending(false);
      (document.getElementById('inputBox') as HTMLInputElement).value = '';
    } catch (e) {
      // TODO: play failure sound here and remove message from feed
      // later we want to retry it offer the option to
      setSending(false);
      console.error('error sending message', e);
    }
  };
  const handleEnter = (e: any) => {
    if (e.keyCode == 13 && e.shiftKey == false) {
      e.preventDefault();
      handleSubmit(text);
    }
  };
  return (
    <Container>
      <InputBox
        disabled={sending}
        placeholder='Write a message...'
        id='inputBox'
        cols={60}
        rows={5}
        maxLength={200}
        onKeyDown={(e) => {
          handleEnter(e);
        }}
        onChange={(e) => {
          setText(e.target.value);
          setTextLength(e.target.value.length);
        }}
      />
      <>
        <LetterCount>{textLength}/200</LetterCount>
        <SendButton
          onClick={() => {
            handleSubmit(text);
          }}
        >
          Send
        </SendButton>
      </>
    </Container>
  );
};

const Container = styled.div`
  padding: 0.6em 0.6em;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.6em;
  min-height: 6em;
`;

const InputBox = styled.textarea`
  resize: none;
  padding: 0.6em 0.6em;
  line-height: 1.5em;
  width: 100%;
  min-height: 6em;
  border-radius: 0.6em;
  &:disabled {
    background-color: rgb(236, 233, 233);
  }
`;

const SendButton = styled.button`
  padding: 0.5em;
  position: absolute;
  right: 0.8em;
  bottom: 0.8em;
  border-radius: 0.6em;
`;

const LetterCount = styled.div`
  position: absolute;
  left: 1.3em;
  bottom: 0.9em;
  color: grey;
  font-size: 0.5em;
`;
