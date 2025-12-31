export const shareToDiscord = async (imageUrl: string) => {
  try {
    await navigator.clipboard.writeText(imageUrl);
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
  window.open('https://discord.com/channels/@me', '_blank');
  return { success: true };
};
