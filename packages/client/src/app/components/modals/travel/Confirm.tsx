import styled from 'styled-components';
import React, { useCallback, useEffect, useMemo } from 'react';

import { ActionButton } from 'app/components/library';
import { findPathAndCost } from 'network/shapes/Room';
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
    return findPathAndCost(world, components, account.roomIndex, targetRoomIndex);
  }, [world, components, account.roomIndex, targetRoomIndex]);

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

  if (path.length === 0) return null; // still avoid rendering; effect will close

  const toRoom = useMemo(() => getRoomByIndex(world, components, targetRoomIndex), [world, components, targetRoomIndex]);
  const previewSrc = useMemo(() => rooms?.[targetRoomIndex]?.backgrounds?.[0], [targetRoomIndex]);
  const steps = useMemo(() => path.slice(0, -1), [path]);
  const perRow = Math.min(8, Math.max(3, steps.length));
  const rows = Math.max(1, Math.ceil(steps.length / perRow));
  let thumbSize = 30 / perRow;
  if (rows > 1) thumbSize = Math.min(thumbSize, 24 / perRow);
  if (rows > 2) thumbSize = Math.min(thumbSize, 20 / perRow);
  if (rows > 1) thumbSize *= 0.94;
  thumbSize = Math.max(2.1, Math.min(3.9, thumbSize));

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
              <Pill>
                <PillLabel>Stamina</PillLabel>
                <PillValue>{staminaCost}</PillValue>
              </Pill>
            </StatsRow>
          </StatsCard>
          <Divider />
          {steps.length > 0 && (
            <ThumbRow style={{ ['--ts' as any]: `${thumbSize}vw` }}>
              {steps.map((idx, i) => {
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
          {previewSrc ? (
            <PreviewMask>
              <Preview $src={previewSrc} />
            </PreviewMask>
          ) : (
            <PreviewMask>
              <PreviewPlaceholder />
            </PreviewMask>
          )}
        </Right>
      </Body>
      <Footer>
        <ActionButton text='Queue Travel' onClick={queueMoves} />
      </Footer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8vw;
  padding: 0.8vw;
  color: black;
`;
const Body = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1vw;
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
  justify-content: center;
`;
const TitleRow = styled.div`
  font-size: 1.4vw;
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
const Divider = styled.div`
  height: 0.12vw;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 0.06vw;
  /* Pull in slightly from edges to avoid touching rounded corners */
  margin: 0.2vw 0.3vw 0.4vw 0; 
`;
const PreviewMask = styled.div`
  width: 100%;
  height: 20vh;
  border: 0.1vw solid black;
  border-radius: 0.6vw;
  overflow: hidden;
  box-sizing: border-box;
`;
const Preview = styled.div<{ $src: string }>`
  width: 100%;
  height: 100%;
  background-image: url(${(p) => p.$src});
  background-size: cover;
  background-position: center;
`;
const PreviewPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  border: 0.1vw dashed black;
`;
const ThumbRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4vw;
  align-items: center;
`;
const StepGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.2vw;
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
const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
`;