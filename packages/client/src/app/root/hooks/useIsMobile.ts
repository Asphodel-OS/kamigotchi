import { useEffect, useState } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-aspect-ratio: 11/16)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-aspect-ratio: 11/16)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isMobile;
};
