import { useEffect } from 'react';
import { useComponentSettings, Modals } from 'layers/react/store/componentSettings';

type UseModalVisibilityParams = {
  divName: keyof Modals;
  elementId: string;
};

export const useModalVisibility = ({
  divName,
  elementId,
}: UseModalVisibilityParams) => {
  const { modals, setModals } = useComponentSettings();

  const handleClick = () => {
    setModals({ ...modals, [divName]: !modals[divName] });
  };

  useEffect(() => {
    const element = document.getElementById(elementId);
    if (element && modals[divName]) {
      element.style.display = 'block';
    }
  }, [modals[divName], elementId]);

  return { handleClick, isVisible: modals[divName] };
};
