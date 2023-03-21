import { useEffect } from 'react';
import { dataStore, VisibleDivs } from '../store/createStore';

type UseModalVisibilityParams = {
  soundUrl: string | null;
  divName: keyof VisibleDivs;
  elementId: string;
};

export const useModalVisibility = ({
  soundUrl,
  divName,
  elementId,
}: UseModalVisibilityParams) => {
  const { visibleDivs, setVisibleDivs, sound: { volume } } = dataStore();

  const handleClick = () => {
    if(soundUrl){
      const clickSound = new Audio(soundUrl);
      clickSound.volume = volume;
      clickSound.play();
    }
    setVisibleDivs({ ...visibleDivs, [divName]: !visibleDivs[divName] });
  };

  useEffect(() => {
    const element = document.getElementById(elementId);
    if (element && visibleDivs[divName]) {
      element.style.display = 'block';
    }
  }, [visibleDivs[divName], elementId]);

  return { handleClick, visibleDiv: visibleDivs[divName] };
};
