import { deferred, filterNullish } from '@latticexyz/utils';
import Phaser from 'phaser';

import {
  Subject,
  bufferCount,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  pairwise,
  scan,
  throttleTime,
} from 'rxjs';
import { PhaserConfig } from '../config';

export default async function CreatePhaserEngine(options: PhaserConfig) {
  const game = new Phaser.Game(options);

  // Wait for phaser to boot
  const [resolve, , promise] = deferred();
  game.events.on('ready', resolve);
  // skip texture loading in headless mode for unit testing
  game.textures.emit('ready');

  await promise;

  // Bind the game's size to the window size
  function resize() {
    const width = window.innerWidth / game.scale.zoom;
    const height = window.innerHeight / game.scale.zoom;
    game.scale.resize(width, height);
  }
  resize();
  window.addEventListener('resize', resize);

  const input = CreateInput(game.input);
  const scenes = {
    Main: { input, phaserScene: { ...game } },
  };
  return {
    game,
    scenes,
    dispose: () => {
      game.destroy(true);
      window.removeEventListener('resize', resize);
    },
  };
}

function CreateInput(inputPlugin: Phaser.Input.InputManager) {
  const disposers = new Set();
  const enabled = { current: true };
  inputPlugin.mouse.disableContextMenu();
  function disableInput() {
    enabled.current = false;
  }
  function enableInput() {
    enabled.current = true;
  }
  function setCursor(cursor: string) {
    inputPlugin.setDefaultCursor(cursor);
  }
  const keyboard$ = new Subject();
  const pointermove$ = fromEvent(document, 'mousemove').pipe(
    filter(() => enabled.current),
    map(() => {
      let _a;
      return {
        pointer: (_a = inputPlugin.manager) === null || _a === void 0 ? void 0 : _a.activePointer,
      };
    }),
    filterNullish()
  );
  const pointerdown$ = fromEvent(document, 'mousedown').pipe(
    filter(() => enabled.current),
    map((event) => {
      let _a;
      return {
        pointer: (_a = inputPlugin.manager) === null || _a === void 0 ? void 0 : _a.activePointer,
        event: event,
      };
    }),
    filterNullish()
  );
  const pointerup$ = fromEvent(document, 'mouseup').pipe(
    filter(() => enabled.current),
    map((event) => {
      let _a;
      return {
        pointer: (_a = inputPlugin.manager) === null || _a === void 0 ? void 0 : _a.activePointer,
        event: event,
      };
    }),
    filterNullish()
  );
  // Click stream
  const click$ = merge(pointerdown$, pointerup$).pipe(
    filter(() => enabled.current),
    map(({ event }) => [event.type === 'mousedown' && event.button === 0, Date.now()]), // Map events to whether the left button is down and the current timestamp
    bufferCount(2, 1), // Store the last two timestamps
    filter(([prev, now]) => prev[0] && !now[0] && now[1] - prev[1] < 250), // Only care if button was pressed before and is not anymore and it happened within 500ms
    map(() => {
      let _a;
      return (_a = inputPlugin.manager) === null || _a === void 0 ? void 0 : _a.activePointer;
    }), // Return the current pointer
    filterNullish()
  );
  // Double click stream
  const doubleClick$ = pointerdown$.pipe(
    filter(() => enabled.current),
    map(() => Date.now()), // Get current timestamp
    bufferCount(2, 1), // Store the last two timestamps
    filter(([prev, now]) => now - prev < 500), // Filter clicks with more than 500ms distance
    throttleTime(500), // A third click within 500ms is not counted as another double click
    map(() => {
      let _a;
      return (_a = inputPlugin.manager) === null || _a === void 0 ? void 0 : _a.activePointer;
    }), // Return the current pointer
    filterNullish()
  );
  // Right click stream
  const rightClick$ = merge(pointerdown$, pointerup$).pipe(
    filter(({ pointer }) => enabled.current && pointer!.rightButtonDown()),
    map(() => {
      let _a;
      return (_a = inputPlugin.manager) === null || _a === void 0 ? void 0 : _a.activePointer;
    }), // Return the current pointer
    filterNullish()
  );
  // Drag stream
  const drag$ = merge(
    pointerdown$.pipe(map(() => undefined)), // Reset the drag on left click
    merge(pointerup$, pointermove$).pipe(
      pairwise(), // Take the last two move or pointerup events
      scan(
        (acc, [{ pointer: prev }, { pointer: curr }]) =>
          curr?.leftButtonDown() // If the left butten is pressed...
            ? prev?.leftButtonDown() && acc // If the previous event wasn't mouseup and if the drag already started...
              ? {
                  ...acc,
                  width: curr.worldX - acc.x,
                  height: curr.worldY - acc.y,
                } // Update the width/height
              : { x: curr.worldX, y: curr.worldY, width: 0, height: 0 } // Else start the drag
            : undefined,
        undefined
      ),
      filterNullish(),
      filter(
        (area: { width: number; height: number }) =>
          Math.abs(area.width) > 10 && Math.abs(area.height) > 10
      ) // Prevent clicking to be mistaken as a drag
    )
  ).pipe(
    filter(() => enabled.current),
    distinctUntilChanged() // Prevent same value to be emitted in a row
  );

  function dispose() {
    for (const disposer of disposers) {
      disposer();
    }
  }
  return {
    keyboard$: keyboard$.asObservable(),
    pointermove$,
    pointerdown$,
    pointerup$,
    click$,
    doubleClick$,
    rightClick$,
    drag$,
    // pressedKeys,
    dispose,
    disableInput,
    enableInput,
    setCursor,
    enabled,
    // onKeyPress,
  };
}
