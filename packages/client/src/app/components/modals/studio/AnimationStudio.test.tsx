import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock dev-only components used inside the modal to keep tests light
vi.mock('app/components/shaders/ShaderStack', () => ({
  ShaderStack: () => null,
}));
vi.mock('app/components/library', async () => {
  const actual = await vi.importActual<any>('app/components/library');
  return {
    ...actual,
    ModalWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ModalHeader: () => null,
    KamiCard: () => null,
  };
});
vi.mock('app/cache/account', () => ({
  getAccount: vi.fn(),
  getAccountKamis: vi.fn(() => []),
}));
vi.mock('network/shapes/Account', () => ({
  queryAccountFromEmbedded: vi.fn(() => 1),
}));

// Spy sounds
vi.mock('utils/sounds', () => ({
  playClick: vi.fn(),
}));

import { AnimationStudio } from './AnimationStudio';
import { playClick } from 'utils/sounds';

// Force dev mode gating to pass
Object.defineProperty(window, 'location', {
  value: { hostname: 'localhost', port: '3000' },
});

describe('AnimationStudio sound triggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to render the modal
  const renderStudio = () =>
    render(
      // Render the component's Render function with minimal network stub
      <>{AnimationStudio.Render({ network: {} as any } as any)}</>
    );

  it('plays click when using top Open/Toggle/Reset buttons', () => {
    renderStudio();

    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(screen.getByText('Toggle State'));
    fireEvent.click(screen.getByText('Reset UI'));

    expect(playClick).toHaveBeenCalledTimes(3);
  });

  it('plays click for Open Selected and Clear Selection', () => {
    renderStudio();

    fireEvent.click(screen.getByText('Open Selected'));
    fireEvent.click(screen.getByText('Clear Selection'));

    expect(playClick).toHaveBeenCalledTimes(2);
  });

  it('plays click for Send Event', () => {
    renderStudio();
    fireEvent.click(screen.getByText('Send Event'));
    expect(playClick).toHaveBeenCalledTimes(1);
  });

  it('plays click for Refresh Kami', () => {
    renderStudio();
    fireEvent.click(screen.getByText('↻ Refresh Kami'));
    expect(playClick).toHaveBeenCalledTimes(1);
  });

  it('plays click for state change buttons', () => {
    renderStudio();
    fireEvent.click(screen.getByText('Idle'));
    fireEvent.click(screen.getByText('Cooldown'));
    fireEvent.click(screen.getByText('Harvesting'));
    fireEvent.click(screen.getByText('Healing'));
    fireEvent.click(screen.getByText('Murdered'));
    fireEvent.click(screen.getByText('Trigger Cooldown Now'));
    expect(playClick).toHaveBeenCalledTimes(6);
  });
});



