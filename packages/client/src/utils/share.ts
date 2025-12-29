export const shareToDiscord = async (imageUrl: string) => {
  // Copy URL to clipboard
  await navigator.clipboard.writeText(imageUrl);

  // Open Discord web app in new tab
  window.open('https://discord.com/channels/@me', '_blank');

  return { success: true };
};
