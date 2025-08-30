import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { SettingsIcon } from 'assets/images/icons/menu';
import { ShaderStack } from 'app/components/shaders/ShaderStack';
import { makeSteamLayer } from 'app/components/shaders/SteamShader';
import { makeStaticLayer } from 'app/components/shaders/StaticShader';
import { KamiCard } from 'app/components/library';
import type { Kami } from 'network/shapes/Kami';
import { getAccount, getAccountKamis } from 'app/cache/account';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { calcCooldownRequirement } from 'app/cache/kami';
import { Modals, useVisibility } from 'app/stores';
import { useDevControls } from 'app/stores/devControls';
import React, { useEffect, useMemo, useState } from 'react';

// A completely local, safe animation playground. It never calls network/api.
// Only available in development mode (localhost:3000)
export const AnimationStudio: UIComponent = {
  id: 'AnimationStudio',
  requirement: (layers) =>
    interval(1000).pipe(
      map(() => ({ network: layers.network }))
    ),
  Render: ({ network }) => {
    // Only allow in development mode (localhost:3000)
    const isDev = window.location.hostname === 'localhost' && 
                  window.location.port === '3000';
    
    if (!isDev) return null;
    const { modals, setModals, toggleModals, fixtures, setFixtures, validators, setValidators } = useVisibility();
    const { send } = useDevControls();
    const [selectedModal, setSelectedModal] = useState<keyof Modals>('map');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [kamiState, setKamiState] = useState<'idle' | 'cooldown' | 'murdered' | 'harvesting' | 'healing'>('idle');
    const [cooldownSec, setCooldownSec] = useState<number | undefined>(undefined);
    const [tick, setTick] = useState<number>(0);

    const [realKami, setRealKami] = useState<Kami | undefined>(undefined);
    
    const refreshKami = () => {
      try {
        const accountEntity = queryAccountFromEmbedded(network);
        const kamis = getAccountKamis(network.world, network.components, accountEntity, { live: 0 });
        setRealKami(kamis?.[0]);
        console.log("Fetched Kami:", kamis?.[0]?.name);
      } catch (e) {
        console.warn("Failed to fetch Kami:", e);
        setRealKami(undefined);
      }
    };
    
    // Refresh Kami when the modal becomes visible
    useEffect(() => {
      if (modals.animationStudio) {
        refreshKami();
      }
    }, [modals.animationStudio]);

    const mockKami: Kami = useMemo(() => {
      const now = Date.now();
      const base: any = {
        id: '0xMOCK',
        entity: 1,
        index: 1,
        name: realKami?.name || 'Debug Kami',
        image: realKami?.image || 'https://dummyimage.com/256x256/111/fff&text=KAMI',
        progress: realKami?.progress || { level: 1, experience: 0 },
        skills: realKami?.skills || { points: 0 },
        stats: realKami?.stats || { health: { total: 100, rate: 0, sync: 100 } },
        time: ((): any => {
          const nowSec = Math.floor(now / 1000);
          const t: any = realKami?.time || {};
          const lastRaw: any = (t.lastActive ?? t.last ?? nowSec);
          const cdRaw: any = (t.cooldown ?? nowSec);
          return { last: Number(lastRaw), cooldown: Number(cdRaw) };
        })(),
        state: 'RESTING',
      };
      if (realKami?.index) base.index = realKami.index;
      return base as Kami;
    }, [realKami]);

    // simulated states (shh the kamis don't know)
    const simKami: Kami = useMemo(() => {
      const k: any = JSON.parse(JSON.stringify(mockKami));
      const nowSec = Math.floor(Date.now() / 1000);
      if (kamiState === 'cooldown') {
        k.state = 'RESTING';
        k.time.cooldown = Number(cooldownSec ?? nowSec);
      } else if (kamiState === 'harvesting') {
        k.state = 'HARVESTING';
        k.harvest = {
          id: '0xHARV',
          entity: 1,
          balance: 0,
          state: 'ACTIVE',
          rates: { fertility: 0, intensity: { average: 0, spot: 0 }, total: { average: 0, spot: 0 } },
          time: { last: nowSec - 5, reset: nowSec - 60, start: nowSec - 30 },
          node: { index: 1, name: 'Debug Node' } as any,
        };
        k.time.cooldown = Number(cooldownSec ?? (nowSec - 120));
      } else if (kamiState === 'healing') {
        k.state = 'RESTING';
        k.stats.health.sync = Math.max(0, (k.stats.health.sync ?? 50) - 10);
        k.time.last = nowSec - 5;
      } else if (kamiState === 'murdered') {
        k.state = 'DEAD';
        k.stats.health.total = 0;
        k.stats.health.sync = 0;
      } else {
        k.state = 'RESTING';
      }
      return k as Kami;
    }, [mockKami, kamiState, cooldownSec]);

    const layers = useMemo(() => [
      makeSteamLayer({ speed: 1.2, density: 0.9, hue: 0.58, alpha: 0.6, brightness: 0.9 }),
      makeStaticLayer({ alpha: 0.25, brightness: 1.2, rgbOffsetOpt: 1.0, scalinesOpt: 1.0 }),
    ], []);

    const [blockNumber, setBlockNumber] = useState<number | null>(null);
    useEffect(() => {
      const sub = (network?.blockNumber$ as any)?.subscribe?.((bn: any) => {
        const n = typeof bn === 'bigint' ? Number(bn) : Number(bn ?? NaN);
        if (!Number.isNaN(n)) setBlockNumber(n);
      });
      return () => sub?.unsubscribe?.();
    }, [network]);

    useEffect(() => {
      if (!modals.animationStudio) return;
      const id = setInterval(() => setTick((t) => (t + 1) % 1_000_000), 1000);
      return () => clearInterval(id);
    }, [modals.animationStudio]);

    const [selectedSet, setSelectedSet] = useState<Set<keyof Modals>>(new Set());

    return (
      <ModalWrapper
        id='animationStudio'
        header={<ModalHeader title='Animation Studio' icon={SettingsIcon} />}
        overlay
        canExit
      >
        <Container>
          <Sidebar>
            <h4>Modal Manager</h4>
            <Row>
              <Select value={selectedModal} onChange={(e) => setSelectedModal(e.target.value as keyof Modals)}>
                {Object.keys(modals)
                  .filter((k) => k !== 'animationStudio')
                  .map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
              </Select>
              <OpenButton
                onClick={() => {
                  try {
                    if (!(selectedModal in modals)) throw new Error(`Unknown modal: ${String(selectedModal)}`);
                    toggleModals(false);
                    setModals({ animationStudio: true, [selectedModal]: true } as any);
                    setErrorMsg(null);
                  } catch (e: any) {
                    setErrorMsg(e?.message || 'Failed to open selected modal');
                  }
                }}
              >
                Open
              </OpenButton>
              <OpenButton
                onClick={() => {
                  try {
                    // send a generic toggle event to the selected modal
                    send(selectedModal, 'toggle');
                    setErrorMsg(null);
                  } catch (e: any) {
                    setErrorMsg(e?.message || 'Failed to toggle state');
                  }
                }}
              >
                Toggle State
              </OpenButton>
              <OpenButton
                onClick={() => {
                  try {
                    toggleModals(false);
                    setModals({ animationStudio: true });
                    setErrorMsg(null);
                  } catch (e: any) {
                    setErrorMsg(e?.message || 'Failed to reset modals');
                  }
                }}
              >
                Reset UI
              </OpenButton>
            </Row>
            {errorMsg && <ErrorMsg>⚠ {errorMsg}</ErrorMsg>}

            <Divider />
            <h4>Bulk Open</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {Object.keys(modals)
                .filter((k) => k !== 'animationStudio')
                .map((key) => (
                  <li key={key}>
                    <label>
                      <input
                        type='checkbox'
                        checked={selectedSet.has(key as keyof Modals)}
                        onChange={(e) => {
                          const next = new Set(selectedSet);
                          if (e.target.checked) next.add(key as keyof Modals);
                          else next.delete(key as keyof Modals);
                          setSelectedSet(next);
                        }}
                      />
                      <span style={{ marginLeft: '0.4vw' }}>{key}</span>
                    </label>
                  </li>
                ))}
            </ul>
            <Row>
              <OpenButton
                onClick={() => {
                  try {
                    const payload: Partial<Modals> = { animationStudio: true } as any;
                    selectedSet.forEach((k) => ((payload as any)[k] = true));
                    toggleModals(false);
                    setModals(payload);
                    setErrorMsg(null);
                  } catch (e: any) {
                    setErrorMsg(e?.message || 'Failed to open selected set');
                  }
                }}
              >
                Open Selected
              </OpenButton>
              <OpenButton onClick={() => setSelectedSet(new Set())}>Clear Selection</OpenButton>
            </Row>

            <Divider />
            <h4>Fixtures</h4>
            <Toggles>
              {Object.entries(fixtures).map(([k, v]) => (
                <label key={k}>
                  <input
                    type='checkbox'
                    checked={v as boolean}
                    onChange={(e) => setFixtures({ [k]: e.target.checked } as any)}
                  />
                  <span style={{ marginLeft: '0.4vw' }}>{k}</span>
                </label>
              ))}
            </Toggles>

            <h4>Validators</h4>
            <Toggles>
              {Object.entries(validators).map(([k, v]) => (
                <label key={k}>
                  <input
                    type='checkbox'
                    checked={v as boolean}
                    onChange={(e) => setValidators({ [k]: e.target.checked } as any)}
                  />
                  <span style={{ marginLeft: '0.4vw' }}>{k}</span>
                </label>
              ))}
            </Toggles>

            <Divider />
            <h4>Dev Event Sender</h4>
            <Row>
              <Select value={selectedModal} onChange={(e) => setSelectedModal(e.target.value as keyof Modals)}>
                {['global', ...Object.keys(modals)].map((key) => (
                  <option key={key} value={key as any}>
                    {key}
                  </option>
                ))}
              </Select>
              <Input type='text' placeholder='type (e.g., tab, mode, set)' id='dev_type' />
            </Row>
            <TextArea id='dev_payload' placeholder='payload JSON (optional)'></TextArea>
            <Row>
              <OpenButton
                onClick={() => {
                  try {
                    const type = (document.getElementById('dev_type') as HTMLInputElement)?.value || 'toggle';
                    const raw = (document.getElementById('dev_payload') as HTMLTextAreaElement)?.value;
                    const payload = raw ? JSON.parse(raw) : undefined;
                    send(selectedModal as any, type, payload);
                    setErrorMsg(null);
                  } catch (e: any) {
                    setErrorMsg(e?.message || 'Invalid payload JSON');
                  }
                }}
              >
                Send Event
              </OpenButton>
            </Row>

            <Divider />
            <h4>Network</h4>
            <KV>
              <label>Connected</label>
              <span>{String((network as any)?.connected?.get?.() ?? 'unknown')}</span>
            </KV>
            <KV>
              <label>Block</label>
              <span>{blockNumber ?? '...'} / tick {tick}</span>
            </KV>

          </Sidebar>
          <Preview>
            <ShaderStack layers={layers} animateWhenOffscreen style={{ zIndex: 0 }} />
            <KamiPreview>
              <KamiPreviewHeader>
                <span>Kami Card Preview</span>
                <RefreshButton onClick={refreshKami}>↻ Refresh Kami</RefreshButton>
              </KamiPreviewHeader>
              <KamiCard
                kami={simKami}
                description={[`Status: ${kamiState}`, realKami ? 'Using live Kami data' : 'Fallback mock']}
                showCooldown
                showBattery
                showLevelUp
                showSkillPoints
              />
              <KamiControls>
                <StateButton onClick={() => setKamiState('idle')}>Idle</StateButton>
                <StateButton onClick={() => setKamiState('cooldown')}>Cooldown</StateButton>
                <StateButton onClick={() => setKamiState('harvesting')}>Harvesting</StateButton>
                <StateButton onClick={() => setKamiState('healing')}>Healing</StateButton>
                <StateButton onClick={() => setKamiState('murdered')}>Murdered</StateButton>
                <StateButton 
                  onClick={() => {
                    const nowSec = Math.floor(Date.now() / 1000);
                    try {
                      // Start at the final second of cooldown to preview the wipe
                      const req = calcCooldownRequirement(mockKami);
                      const cdStart = nowSec - (req - 1); // so remaining ~1s
                      setCooldownSec(cdStart);
                      setKamiState('cooldown');
                    } catch {
                      setCooldownSec(nowSec);
                      setKamiState('cooldown');
                    }
                  }}
                >
                  Trigger Cooldown Now
                </StateButton>
              </KamiControls>
            </KamiPreview>
          </Preview>
        </Container>
      </ModalWrapper>
    );
  },
};

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  gap: 1.2vw;
  padding: 0.8vh 1.2vw;
  min-height: 40vh;
`;

const Preview = styled.div`
  position: relative;
  width: 48vw;
  min-height: 36vh;
  border: 2px solid #222;
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  margin-top: 80px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6vh;
  width: 24vw;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.6vw;
`;

const Divider = styled.hr`
  color: #333;
  width: 100%;
`;

const Select = styled.select`
  font-family: Pixel;
  font-size: 0.9vw;
  padding: 0.2vw 0.4vw;
`;

const OpenButton = styled.button`
  font-family: Pixel;
  font-size: 0.9vw;
  padding: 0.2vw 0.6vw;
  cursor: pointer;
`;

const ErrorMsg = styled.div`
  color: #b00020;
  font-family: Pixel;
  font-size: 0.9vw;
`;

const Toggles = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4vh 0.8vw;
`;

const Input = styled.input`
  font-family: Pixel;
  font-size: 0.9vw;
  padding: 0.2vw 0.4vw;
`;

const TextArea = styled.textarea`
  font-family: Pixel;
  font-size: 0.9vw;
  min-height: 8vh;
`;

const KV = styled.div`
  display: flex;
  justify-content: space-between;
`;

const KamiPreview = styled.div`
  position: relative;
  z-index: 1;
  padding: 1vw;
  display: flex;
  flex-direction: column;
  gap: 0.4vw;
  pointer-events: auto;
`;

const KamiPreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9vw;
  color: #ddd;
`;

const KamiControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4vw;
  margin-top: 0.8vh;
  width: 100%;
  max-width: 48vw;
`;

const StateButton = styled.button`
  font-family: Pixel;
  font-size: 0.9vw;
  padding: 0.3vw 0.6vw;
  cursor: pointer;
  background: #333;
  color: white;
  border: 1px solid #555;
  border-radius: 3px;
  flex: 0 1 auto;
  white-space: nowrap;
  margin-bottom: 0.3vh;
  &:hover {
    background: #444;
  }
`;

const RefreshButton = styled.button`
  font-family: Pixel;
  font-size: 0.8vw;
  padding: 0.1vw 0.4vw;
  cursor: pointer;
  background: transparent;
  color: #aaa;
  border: 1px solid #555;
  border-radius: 3px;
  &:hover {
    background: #333;
    color: white;
  }
`;