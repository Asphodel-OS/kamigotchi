import { dataStore } from 'layers/react/store/createStore';

// checks the open modals to see if a click occured over an open modal
export function checkModalCoverage(e: Phaser.Input.Pointer): boolean {
  const { visibleModals } = dataStore.getState();

  // check whether the input click overlaps with a modal by its element id
  const doesOverlap = (id: string) => {
    const modalDiv = document.getElementById(id);
    if (!modalDiv) return false;

    const boundingRect = modalDiv.getBoundingClientRect();
    return (
      e.downX > boundingRect.left &&
      e.downX < boundingRect.right &&
      e.downY > boundingRect.top &&
      e.downY < boundingRect.bottom
    );
  };

  // check all open modals for any overlap
  return Object.entries(visibleModals).reduce((overlaps, [id, isOpen]) => {
    return overlaps || (isOpen && doesOverlap(id));
  }, false);
}