export function parsePhotoUrls(photosValue) {
  if (!photosValue) {
    return [];
  }

  // MLS photo data is inconsistent: some rows are already arrays, some are JSON
  // strings, and some are malformed, so parsing must fail closed to an empty list.
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
