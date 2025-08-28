import styled from 'styled-components';

import { ActionButton, ModalHeader, ModalWrapper } from 'app/components/library';
import { findPathAndCost } from 'network/shapes/Room/path';
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

  const { path, moves, staminaCost } = findPathAndCost(
    world,
    components,
    account.roomIndex,
    targetRoomIndex
  );

  const queueMoves = () => {
    if (path.length <= 1) return onClose();
    for (let i = 1; i < path.length; i++) {
      const step = path[i];
      actions.add({
        action: 'AccountMove',
        params: [step],
        description: `Moving to ${getRoomByIndex(world, components, step).name}`,
        execute: async () => api.player.account.move(step),
      });
    }
    onQueued?.();
    onClose();
  };

  if (path.length === 0) return null;

  const toRoom = getRoomByIndex(world, components, targetRoomIndex);
  const previewSrc = rooms?.[targetRoomIndex]?.backgrounds?.[0];
  const steps = path.slice(0, -1);
  const perRow = Math.min(8, Math.max(3, steps.length));
  const rows = Math.max(1, Math.ceil(steps.length / perRow));
  let thumbSize = 30 / perRow;
  if (rows > 1) thumbSize = Math.min(thumbSize, 24 / perRow);
  if (rows > 2) thumbSize = Math.min(thumbSize, 20 / perRow);
  // safety margin to avoid bottom clipping when wrapping
  if (rows > 1) thumbSize *= 0.94;
  thumbSize = Math.max(2.1, Math.min(3.9, thumbSize));

  return (
    <ModalWrapper
      id='travelConfirm'
      header={<ModalHeader title='Fast Travel' />}
      canExit
      overlay
      truncate
      positionOverride={{ colStart: 25, colEnd: 75, rowStart: 20, rowEnd: 80, position: 'fixed' }}
    >
      <Container>
        <Body>
          <Left>
            <TitleRow>
              Travel to <RoomName>{toRoom.name}</RoomName>?
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
                {steps
                  .map((idx, i) => {
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

            <Spacer />
          </Left>
          <Right>
            {previewSrc ? <Preview $src={previewSrc} /> : <PreviewPlaceholder />}
            <ButtonsBarRight>
              <ActionButton text='Cancel' onClick={onClose} />
              <ActionButton text='Confirm' onClick={queueMoves} />
            </ButtonsBarRight>
          </Right>
        </Body>
      </Container>
    </ModalWrapper>
  );
};

const Container = styled.div`
  padding: 1.2vw;
  display: flex;
  gap: 0.9vw;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  border-radius: 1vw;
  box-shadow: 0 0.6vw 2vw rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(2px);
`;

const Body = styled.div`
  display: flex;
  gap: 1vw;
`;

const Left = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8vw;
  flex: 1 1 auto;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 14vw;
  flex-direction: column;
`;

const TitleRow = styled.div`
  color: #222;
  font-size: 1.2vw;
  font-weight: 600;
`;

const RowSub = styled.div`
  color: #555;
  font-size: 0.8vw;
`;

const Row = styled.div`
  color: #222;
  font-size: 1vw;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 0.6vw;
  flex-wrap: wrap;
`;

const StatsCard = styled.div`
  display: flex;
  padding: 0;
  margin: 0 0 0.3vw 0;
`;

const Divider = styled.div`
  width: 100%;
  height: 0.12vw;
  background: #e5e7eb;
  border-radius: 0.06vw;
  margin: 0.3vw 0 0.6vw 0;
`;

const Pill = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: 0.4vw;
  padding: 0.4vw 0.8vw;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
`;

const PillLabel = styled.span`
  color: #475569;
  font-size: 0.75vw;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const PillValue = styled.span`
  color: #0f172a;
  font-size: 0.95vw;
  font-weight: 700;
`;

const ThumbRow = styled.div`
  display: flex;
  align-items: center;
  gap: calc(var(--ts, 3.4vw) * 0.12);
  flex-wrap: wrap;
  max-height: 8.2vw; /* allow a bit more room for larger thumbs */
  overflow: hidden;
  align-content: flex-start;
  padding-bottom: 0.6vw; /* ensure thumbs clear the container bottom */
`;

const StepGroup = styled.span`
  display: inline-flex;
  align-items: center;
  gap: calc(var(--ts, 3.4vw) * 0.1);
`;

const Thumb = styled.div<{ $src: string }>`
  width: var(--ts, 3.4vw);
  height: var(--ts, 3.4vw);
  border-radius: calc(var(--ts, 3.4vw) * 0.12);
  border: 0.12vw solid #000000;
  background: ${({ $src }) => `url(${$src}) center/cover no-repeat`};
`;

const ThumbPlaceholder = styled.div`
  width: var(--ts, 3.4vw);
  height: var(--ts, 3.4vw);
  border-radius: calc(var(--ts, 3.4vw) * 0.12);
  border: 0.12vw solid #000000;
  background: #f1f5f9;
`;

const ArrowSmall = styled.span`
  color: #64748b;
  font-size: calc(var(--ts, 3.4vw) * 0.26);
`;

const ArrowBig = styled.span`
  color: #475569;
  font-size: calc(var(--ts, 3.4vw) * 0.38);
  margin: 0 0.1vw 0 0.1vw;
`;

const Spacer = styled.div`
  flex-grow: 1;
`;

const Preview = styled.div<{ $src: string }>`
  width: 14vw;
  height: 14vw;
  border-radius: 0.8vw;
  border: 0.15vw solid #000000;
  background: ${({ $src }) => `url(${$src}) center/cover no-repeat`};
  box-shadow: inset 0 0 0 0.1vw rgba(0, 0, 0, 0.06);
`;

const PreviewPlaceholder = styled.div`
  width: 14vw;
  height: 14vw;
  border-radius: 0.8vw;
  border: 0.15vw solid #000000;
  background: #f8fafc;
`;

const ButtonsBar = styled.div`
  display: flex;
  gap: 0.6vw;
  justify-content: flex-end;
  align-self: flex-end;
`;

const ButtonsBarRight = styled(ButtonsBar)`
  margin-top: 0.6vw;
  width: 100%;
  justify-content: center;
`;

const RoomName = styled.span`
  color: #2b6cb0;
`; 