import { animate, createScope, createSpring, Scope } from 'animejs';
import { useEffect, useRef } from 'react';

import { IndicatorIcons } from 'assets/images/icons/indicators';

export const LevelUpArrows = () => {
  const scope = useRef<Scope | null>(null);
  const ArrowRefs = useRef<Array<HTMLImageElement | null>>(new Array(7).fill(null));

  useEffect(() => {
    scope.current = createScope().add(() => {
      ArrowRefs.current.forEach((ref, index) => {
        if (ref) {
          animate(ref, {
            translateX: [
              { to: '-30%', duration: 50, easing: 'easeInOutSine' },
              { to: '30%', duration: 50, easing: 'easeInOutSine' },
              { to: '-30%', duration: 50, easing: 'easeInOutSine' },
            ],
            translateY: ['150%', '-500%'],
            scale: [
              { to: 1.25, ease: 'inOut(3)', duration: 200 },
              { to: 1, ease: createSpring({ stiffness: 300 }) },
            ],
            loop: true,
            delay: 250 * (index + 0.01),
            loopDelay: 250 * (index + 0.01),
            direction: 'alternate',
            duration: 1000,
          });
        }
      });
    });

    return () => scope.current?.revert();
  }, []);

  const positions = [70, 7, 60, 20, 10, 30, 50];

  return (
    <>
      {positions.map((pos, i) => (
        <img
          key={`arrow-${i}`}
          src={IndicatorIcons.level_up}
          ref={(el) => (ArrowRefs.current[i] = el)}
          style={{
            position: 'absolute',
            left: `${pos}%`,
            bottom: '10%',
            width: '20%',
            height: '20%',
          }}
        />
      ))}
    </>
  );
};
