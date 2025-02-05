import { CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { useState } from 'react';
import styled from 'styled-components';

import { EntityID, EntityIndex, World } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { ActionSystem } from 'network/systems';
import { waitForActionCompletion } from 'network/utils';
import { playScribble } from 'utils/sounds';

interface Props {
  actionSystem: ActionSystem;
  actions: {
    pushCast: (cast: CastWithInteractions) => void;
  };
  api: any;
  world: World;
}

export const InputRow = (props: Props) => {
  const { actionSystem, api, world } = props;
  const [text, setText] = useState('');
  const [textLength, setTextLength] = useState(0);

  /////////////////
  // INTERACTION

  const onSubmit = (text: string) => {
    playScribble();
    // TODO: play success sound and update message in feed here (to succeeded)
    const actionID = uuid() as EntityID;
    actionSystem!.add({
      id: actionID,
      action: 'SendMessage',
      params: [text],
      description: `Send Message`,
      execute: async () => {
        return api.player.social.chat.send(text);
      },
    });
    return actionID;
  };

  const handleSubmit = async (text: string) => {
    if (text.length === 0) return;
    try {
      const rerollActionID = onSubmit(text);
      if (!rerollActionID) throw new Error('Sending message action failed');
      await waitForActionCompletion(
        actionSystem!.Action,
        world.entityToIndex.get(rerollActionID) as EntityIndex
      );
      setText('');
      setTextLength(0);
      (document.getElementById('inputBox') as HTMLInputElement).value = '';
    } catch (e) {
      // TODO: play failure sound here and remove message from feed
      // later we want to retry it offer the option to
      console.error('error sending message', e);
    }
  };

  return (
    <Container>
      <InputBox
        placeholder='Write a message...'
        id='inputBox'
        cols={60}
        rows={5}
        maxLength={200}
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
  padding: 0.6vw 0.6vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.6vw;
  min-height: 6vh;
`;

const InputBox = styled.textarea`
  resize: none;
  padding: 0.6vw 0.6vw;
  line-height: 1.5vh;
  width: 100%;
  min-height: 6vh;
  border-radius: 0.6vw;
`;

const SendButton = styled.button`
  padding: 0.5vw;
  position: absolute;
  right: 0.8vw;
  bottom: 0.8vw;
  border-radius: 0.6vw;
`;

const LetterCount = styled.div`
  position: absolute;
  left: 1.3vw;
  bottom: 0.9vw;
  color: grey;
  font-size: 0.5vw;
`;
