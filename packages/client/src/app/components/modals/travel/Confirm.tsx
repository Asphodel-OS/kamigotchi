import styled from 'styled-components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ActionButton, TextTooltip } from 'app/components/library';
import { calcCurrentStamina } from 'app/cache/account/calcs';
import { findPathAndCost } from 'network/shapes/Room';
import { passesConditions } from 'network/shapes/Conditional/functions';
import { NetworkLayer } from 'network/create';
import { Account } from 'network/shapes/Account';
import { getRoomByIndex } from 'network/shapes/Room/functions';
import { rooms } from 'constants/rooms';

export const TravelConfirm = ({
  network,
  account,
  targetRoomIndex,
  onQueued,
  onClose,
}: {
  network: NetworkLayer;
  account: Account;
  targetRoomIndex: number;
  onQueued?: () => void;
  onClose: () => void;
}) => {
  const { world, components, actions, api } = network;

  const { path, moves, staminaCost } = useMemo(() => {
    return findPathAndCost(
      world,
      components,
      account.roomIndex,
      targetRoomIndex,
      (w, c, roomIndex) => {
        const room = getRoomByIndex(w, c, roomIndex);
        if (!room) return false;
        return passesConditions(w, c, room.gates, account);
      }
    );
  }, [world, components, account, account.roomIndex, targetRoomIndex]);

  const queueMoves = useCallback(() => {
    if (path.length <= 1) return onClose();
    for (let i = 1; i < path.length; i++) {
      const step = path[i];
      actions.add({
        action: 'AccountMove',
        params: [step],
        description: `Moving to ${getRoomByIndex(world, components, step).name}`,
        execute: async () => {
          try {
            await api.player.account.move(step);
          } catch (err) {
            console.error('AccountMove failed for step', step, err);
            throw err;
          }
        },
      });
    }
    onQueued?.();
    onClose();
  }, [actions, api.player.account, components, onClose, onQueued, path, world]);

  useEffect(() => {
    if (path.length === 0) onClose();
  }, [path.length, onClose]);

  const toRoom = useMemo(() => getRoomByIndex(world, components, targetRoomIndex), [world, components, targetRoomIndex]);
  const previewSrc = useMemo(() => {
    const arr = rooms?.[targetRoomIndex]?.backgrounds;
    return Array.isArray(arr) && arr.length ? arr[arr.length - 1] : undefined;
  }, [targetRoomIndex]);
  const [previewRatio, setPreviewRatio] = useState<number | null>(null);
  useEffect(() => {
    if (!previewSrc) { setPreviewRatio(null); return; }
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setPreviewRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = previewSrc;
    return () => { img.onload = null; };
  }, [previewSrc]);
  const steps = useMemo(() => path.slice(0, -1), [path]);
  const perRow = Math.min(6, Math.max(3, steps.length));
  const rows = Math.max(1, Math.ceil(steps.length / perRow));
  let thumbSize = 34 / perRow;
  if (rows > 1) thumbSize = Math.min(thumbSize, 24 / perRow);
  if (rows > 2) thumbSize = Math.min(thumbSize, 20 / perRow);
  if (rows > 1) thumbSize *= 0.94;
  thumbSize = Math.max(2.4, Math.min(5.4, thumbSize));

  const currentStamina = useMemo(() => calcCurrentStamina(account), [account.stamina.sync, account.time.action, account.config]);
  const staminaRemaining = useMemo(() => Math.max(0, currentStamina - staminaCost), [currentStamina, staminaCost]);

  // Early-return guard AFTER hooks have been declared to satisfy React's rules.
  // If there is no valid path, effect above will also trigger onClose.
  if (path.length === 0) return null;

  return (
    <Container>
      <Body>
        <Left>
          <TitleRow>
            <TitlePrefix>Travel to </TitlePrefix><RoomName>{toRoom.name}</RoomName>?
          </TitleRow>
          <StatsCard>
            <StatsRow>
              <Pill>
                <PillLabel>Moves</PillLabel>
                <PillValue>{moves}</PillValue>
              </Pill>
              <TextTooltip text={[`Stamina Remaining After Journey: ${staminaRemaining}`]} direction='row'>
                <Pill>
                  <PillLabel>Stamina</PillLabel>
                  <PillValue>{staminaCost}</PillValue>
                </Pill>
              </TextTooltip>
            </StatsRow>
          </StatsCard>
          <Divider />
          {steps.length > 0 && (
            <ThumbRow $ts={thumbSize}>
              {steps.map((idx: number, i: number) => {
                const src = rooms?.[idx]?.backgrounds?.[0];
                return (
                  <StepGroup key={`step-${i}`}>
                    {src ? <Thumb $src={src} /> : <ThumbPlaceholder />}
                    {i < steps.length - 1 ? <ArrowSmall>→</ArrowSmall> : <ArrowBig>⇢</ArrowBig>}
                  </StepGroup>
                );
              })}
            </ThumbRow>
          )}
        </Left>
        <Right>
          <RightStack>
            {previewSrc ? (
              <PreviewMask $ratio={previewRatio ?? undefined}>
                <Preview $src={previewSrc} />
              </PreviewMask>
            ) : (
              <PreviewMask>
                <PreviewPlaceholder />
              </PreviewMask>
            )}
            <RightActions>
              <ActionButton text='Queue Travel' onClick={queueMoves} disabled={path.length <= 1} />
            </RightActions>
          </RightStack>
        </Right>
      </Body>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6vw;
  padding: 0.6vw;
  color: black;
`;
const Body = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8vw;
  align-items: start;
`;
const Left = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6vw;
`;
const Right = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;
const RightStack = styled.div`
  width: min(100%, 22vw);
  margin-left: auto;
  margin-right: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6vw;
`;
const RightActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;
const TitleRow = styled.div`
  font-size: 1.3vw;
  font-weight: 700;
`;
const TitlePrefix = styled.span`
  color: inherit;
`;
const RoomName = styled.span`
  text-decoration: underline;
  color: #8fc7ff;
`;
const StatsCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4vw;
`;
const StatsRow = styled.div`
  display: flex;
  gap: 0.6vw;
  align-items: center;
  flex-wrap: wrap;
`;
const Pill = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.4vw 0.6vw;
  border: 0.1vw solid black;
  border-radius: 0.4vw;
`;
const PillLabel = styled.div`
  font-size: 0.8vw;
  opacity: 0.7;
`;
const PillValue = styled.div`
  font-size: 1.1vw;
  font-weight: 700;
`;
// removed inline stamina note; now shown via tooltip on the Stamina pill
const Divider = styled.div`
  height: 0.12vw;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 0.06vw;
  /* Pull in slightly from edges to avoid touching rounded corners */
  margin: 0.2vw 0.3vw 0.4vw 0; 
`;
const PreviewMask = styled.div<{ $ratio?: number }>`
  width: min(100%, 22vw);
  height: ${({ $ratio }) => ($ratio ? 'auto' : '16vh')};
  ${({ $ratio }) => ($ratio ? `aspect-ratio: ${$ratio};` : '')}
  border: 0.12vw solid black;
  border-radius: 0.8vw;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
  margin: 0 auto;
`;
const Preview = styled.div<{ $src: string }>`
  width: 100%;
  height: 100%;
  background-image: url(${(p) => p.$src});
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
`;
const PreviewPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  border: 0.12vw dashed black;
  border-radius: 0.8vw;
  background: repeating-conic-gradient(from 0deg, #f8f8f8 0 15%, #eee 0 30%);
`;
const ThumbRow = styled.div<{ $ts: number }>`
  --ts: ${({ $ts }) => $ts}vw;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5vw;
  align-items: center;
`;
const StepGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.3vw;
`;
const Thumb = styled.div<{ $src: string }>`
  width: var(--ts);
  height: var(--ts);
  background-image: url(${(p) => p.$src});
  background-size: cover;
  background-position: center;
  border: 0.08vw solid black;
  border-radius: 0.2vw;
`;
const ThumbPlaceholder = styled.div`
  width: var(--ts);
  height: var(--ts);
  border: 0.08vw dashed black;
  border-radius: 0.2vw;
`;
const ArrowSmall = styled.div``;
const ArrowBig = styled.div`
  font-size: 1.6vw;
`;
// Footer removed; actions are placed inline under the preview