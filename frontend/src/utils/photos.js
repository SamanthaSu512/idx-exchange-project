export function parsePhotoUrls(photosValue) {
  if (!photosValue) {
    return [];
  }

  const photoArray = Array.isArray(photosValue) ? photosValue : parsePhotoJson(photosValue);

  if (!Array.isArray(photoArray)) {
    return [];
  }

  return photoArray.filter((photoUrl) => typeof photoUrl === 'string' && photoUrl.trim() !== '');
}

function parsePhotoJson(photosValue) {
  if (typeof photosValue !== 'string') {
    return [];
  }

  try {
    return JSON.parse(photosValue);
  } catch {
    return [];
  }
}
