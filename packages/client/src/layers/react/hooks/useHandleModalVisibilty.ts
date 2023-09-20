import { useEffect } from 'react';
import { dataStore, VisibleModals } from 'layers/react/store/createStore';

type UseModalVisibilityParams = {
  divName: keyof VisibleModals;
  elementId: string;
};

export const useModalVisibility = ({
  divName,
  elementId,
}: UseModalVisibilityParams) => {
  const { visibleModals, setVisibleModals } = dataStore();

  const handleClick = () => {
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
