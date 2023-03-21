export const triggerPetListModal = (
  object: Phaser.GameObjects.GameObject,
) => {
  return object.setInteractive().on('pointerdown', () => {
    const objectId = document.getElementById('petlist_modal');
    if (objectId) {
      objectId.style.display = 'block';
    }
  });
};
