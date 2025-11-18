import { Dispatch, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { calcHealthPercent, canHarvest, isHarvesting, onCooldown } from 'app/cache/kami';
import { compareTraitAffinity, compareTraitName, compareTraitRarity } from 'app/cache/trait';
import { IconButton, IconListButton, TextTooltip } from 'app/components/library';
import { DropdownToggle } from 'app/components/library/buttons/DropdownToggle';
import { useVisibility } from 'app/stores';
import { CollectIcon, HarvestIcon, StopIcon } from 'assets/images/icons/actions';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { PORTAL_ROOM_INDEX } from 'constants/rooms';
import { Account } from 'network/shapes';
import { Kami } from 'network/shapes/Kami';
import { SortIcons, ViewIcons } from './constants';
import { Sort, View } from './types';

interface DropdownOption {
  text: string;
  object?: any;
}

export const Toolbar = ({
  actions,
  controls,
  data,
  state,
  utils,
}: {
  actions: {
    addKami: (kamis: Kami[]) => void;
    collectKami: (kamis: Kami[]) => void;
    stopKami: (kamis: Kami[]) => void;
    stakeKami: (kamis: Kami[]) => void;
  };
  controls: {
    sort: Sort;
    view: View;
    setSort: Dispatch<Sort>;
    setView: Dispatch<View>;
  };
  data: {
    account: Account;
    kamis: Kami[];
    wildKamis: Kami[];
  };
  state: {
    displayedKamis: Kami[];
    setDisplayedKamis: Dispatch<Kami[]>;
    tick: number;
  };
  utils: { passesNodeReqs: (kami: Kami) => boolean };
}) => {
  const { addKami, collectKami, stopKami, stakeKami } = actions;
  const { sort, setSort, view, setView } = controls;
  const { account, kamis, wildKamis } = data;
  const { displayedKamis, setDisplayedKamis, tick } = state;
  const { passesNodeReqs } = utils;

  const isModalOpen = useVisibility((s) => s.modals.party);

  const [addOptions, setAddOptions] = useState<DropdownOption[]>([]);
  const [collectOptions, setCollectOptions] = useState<DropdownOption[]>([]);
  const [stopOptions, setStopOptions] = useState<DropdownOption[]>([]);
  const [stakeOptions, setStakeOptions] = useState<DropdownOption[]>([]);

  /////////////////
  // SUBSCRIPTIONS

  useEffect(() => {
    if (!isModalOpen) return;

    // if external view, set stake options directly from list of displayed kamis
    if (view === 'external') {
      const stakeOptions = wildKamis.map((kami) => ({ text: kami.name, object: kami }));
      setStakeOptions(stakeOptions);
      return;
    }

    // otherwise, set dropdown options based on internal kami states
    const addOptions = displayedKamis
      .filter((kami) => canHarvest(kami) && passesNodeReqs(kami))
      .map((kami) => ({ text: kami.name, object: kami }));

    const collectOptions = displayedKamis
      .filter((kami) => isHarvesting(kami) && !onCooldown(kami))
      .map((kami) => ({ text: kami.name, object: kami }));

    const stopOptions = displayedKamis
      .filter((kami) => isHarvesting(kami) && !onCooldown(kami))
      .map((kami) => ({ text: kami.name, object: kami }));

    setAddOptions(addOptions);
    setCollectOptions(collectOptions);
    setStopOptions(stopOptions);
  }, [displayedKamis, tick, isModalOpen]);

  // sort kamis when changes are detected
  // TODO: trigger updates after successful state updates
  // NOTE: sorts in place (setDisplayedKamis is just used to trigger a rendering update)
  useEffect(() => {
    if (!isModalOpen) return;

    let sorted = view === 'external' ? wildKamis : kamis;
    if (sort === 'name') {
      sorted = sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'state') {
      sorted = sorted.sort((a, b) => {
        const stateDiff = a.state.localeCompare(b.state);
        if (stateDiff != 0) return stateDiff;
        return calcHealthPercent(a) - calcHealthPercent(b);
      });
    } else if (sort === 'traits') {
      sorted = sorted.sort((a, b) => {
        let diff = 0;
        if (diff === 0) diff = compareTraitAffinity(a.traits?.body!, b.traits?.body!);
        if (diff === 0) diff = compareTraitAffinity(a.traits?.hand!, b.traits?.hand!);
        if (diff === 0) diff = compareTraitRarity(a.traits?.body!, b.traits?.body!);
        if (diff === 0) diff = compareTraitName(a.traits?.body!, b.traits?.body!);
        if (diff === 0) diff = compareTraitRarity(a.traits?.hand!, b.traits?.hand!);
        if (diff === 0) diff = compareTraitName(a.traits?.hand!, b.traits?.hand!);
        return diff;
      });
    }

    setDisplayedKamis(sorted);
  }, [isModalOpen, kamis.length, sort, view]);

  /*
  // JS-driven sticky fallback across browsers: translateY toolbar as parent scrolls
  useEffect(() => {
    if (!isModalOpen) return;
    const toolbarEl = toolbarRef.current;
    if (!toolbarEl) return;

    // Helper: find the nearest scrollable ancestor if explicit container not found
    const findScrollContainer = (start: HTMLElement): HTMLElement | null => {
      let el: HTMLElement | null = start;
      while (el) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
          return el;
        }
        el = el.parentElement;
      }
      return (document.scrollingElement as HTMLElement) || document.documentElement;
    };

    const explicit = toolbarEl.closest("[data-scroll-container='true']") as HTMLElement | null;
    const container = explicit ?? findScrollContainer(toolbarEl);
    if (!container) return;

    let rafId = 0;

    const setY = (y: number) => {
      // Use direct transform to avoid dependency issues and keep this hotfix minimal
      toolbarEl.style.transform = `translateY(${y}px)`;
    };

    const readScrollTop = () => {
      if (container === document.scrollingElement || container === document.documentElement) {
        return document.scrollingElement?.scrollTop ?? window.scrollY ?? 0;
      }
      return (container as HTMLElement).scrollTop;
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const y = readScrollTop();
        setY(y);
        rafId = 0;
      });
    };

    // initialize position and bind
    onScroll();
    container.addEventListener(
      'scroll',
      onScroll as EventListener,
      { passive: true } as AddEventListenerOptions
    );
    detachScroll.current = () => {
      container.removeEventListener('scroll', onScroll as EventListener);
      if (rafId) cancelAnimationFrame(rafId);
    };
    return () => {
      if (detachScroll.current) detachScroll.current();
      toolbarEl.style.transform = 'translateY(0px)';
    };
  }, [isModalOpen]);
*/

  /////////////////
  // INTERACTION

  // toggle between views
  const toggleView = () => {
    if (view === 'external') setView('expanded');
    if (view === 'expanded') setView('collapsed');
    if (view === 'collapsed') setView('external');
  };

  /////////////////
  // INTERPRETATION

  // get DropDownToggle action options, depending on view
  const getDDTActions = (mode: View) => {
    if (mode === 'external') return [stakeKami];
    return [addKami, collectKami, stopKami];
  };

  // get DropDownToggle disabled settings, depending on view
  const getDDTDisabled = (mode: View) => {
    if (mode === 'external') return [account.roomIndex !== PORTAL_ROOM_INDEX];
    return [addOptions.length == 0, collectOptions.length == 0, stopOptions.length == 0];
  };

  // get DropDownToggle icon images, depending on view
  const getDDTIcons = (mode: View) => {
    if (mode === 'external') return [ArrowIcons.down];
    return [HarvestIcon, CollectIcon, StopIcon];
  };

  // get DropDownToggle selection options, depending on view
  const getDDTOptions = (mode: View) => {
    if (mode === 'external') return [stakeOptions];
    return [addOptions, collectOptions, stopOptions];
  };

  // get DropDownToggle tooltips, depending on view
  const getDDTTooltips = (mode: View) => {
    if (mode === 'external') return ['Import Kami. (You must be at Scrap Confluence)'];
    return ['Add Kami to Node', 'Collect Harvest', 'Stop Harvest'];
  };

  // memoized sort options
  const SortOptions = useMemo(
    () =>
      Object.entries(SortIcons).map(([key, image]) => ({
        text: key,
        image,
        onClick: () => setSort(key as Sort),
      })),
    []
  );

  /////////////////
  // RENDER

  return (
    // <Container ref={toolbarRef}>
    <Container>
      <Section>
        <TextTooltip text={[`${view}`]}>
          <IconButton img={ViewIcons[view]} onClick={() => toggleView()} radius={0.6} />
        </TextTooltip>
        <IconListButton img={SortIcons[sort]} text={sort} options={SortOptions} radius={0.6} />
      </Section>
      <DropdownToggle
        limit={33}
        button={{
          images: getDDTIcons(view),
          tooltips: getDDTTooltips(view),
        }}
        disabled={getDDTDisabled(view)}
        onClick={getDDTActions(view)}
        options={getDDTOptions(view)}
        radius={0.6}
      />
    </Container>
  );
};

const Container = styled.div`
  background-color: rgb(238, 238, 238);
  opacity: 0.9;

  /* Avoid Safari white-screen bug when sticky is nested in overflow containers  will-change: transform; position: relative;*/
  position: sticky;
  top: 0;
  z-index: 2;

  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;

  user-select: none;
`;

const Section = styled.div`
  gap: 0.3vw;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  flex-grow: 1;
`;
