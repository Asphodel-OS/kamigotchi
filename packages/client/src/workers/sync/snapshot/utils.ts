async function checkFor403(url: string) {
  var is403 = false;
  var response;
  try {
    response = await fetch(`${url}/healthy`, {
      // Use the base URL
      method: 'GET',
      mode: 'cors',
    });
  } catch (e) {}
  is403 = response?.status == 403;
  console.log('is403', is403);
  return is403;
}

function checkForGrpc8(e: any) {
  const errorCode = e.code || 'unknown';
  console.log('errorCode', errorCode);
  return errorCode == 8;
}

export function isRateLimited(url: string, e: any) {
  console.log('isRateLimited', e);
  return checkForGrpc8(e) || checkFor403(url);
}
