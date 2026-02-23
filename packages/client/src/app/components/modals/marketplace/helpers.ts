export const formatExpiry = (expiryStr: string) => {
  const expiry = Number(expiryStr);
  if (expiry === 0) return 'Never';
  const diff = expiry - Math.floor(Date.now() / 1000);
  if (diff <= 0) return 'Expired';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

export const isExpired = (expiryStr: string) => {
  const expiry = Number(expiryStr);
  if (!expiry) return false;
  return expiry <= Math.floor(Date.now() / 1000);
};
