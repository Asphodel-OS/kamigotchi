import { useEffect } from 'react';
import { useVisibility, Modals } from 'layers/react/store/visibility';

type UseModalVisibilityParams = {
  divName: keyof Modals;
  elementId: string;
};

export const useModalVisibility = ({
  divName,
  elementId,
}: UseModalVisibilityParams) => {
  const { modals, setModals } = useVisibility();

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
