import { useEffect } from 'react';
import { dataStore, VisibleModals } from 'layers/react/store/createStore';

type UseModalVisibilityParams = {
  soundUrl: string | null;
  divName: keyof VisibleModals;
  elementId: string;
};

export const useModalVisibility = ({
  soundUrl,
  divName,
  elementId,
}: UseModalVisibilityParams) => {
  const {
    visibleModals,
    setVisibleModals,
    sound: { volume },
  } = dataStore();

  const handleClick = () => {
    if (soundUrl) {
      const clickSound = new Audio(soundUrl);
      clickSound.volume = volume * 0.6;
      clickSound.play();
    }
    setVisibleModals({ ...visibleModals, [divName]: !visibleModals[divName] });
  };

  useEffect(() => {
    const element = document.getElementById(elementId);
    if (element && visibleModals[divName]) {
      element.style.display = 'block';
    }
  }, [visibleModals[divName], elementId]);

  return { handleClick, isVisible: visibleModals[divName] };
};
