import { parsePhotoUrls } from './photos';

describe('parsePhotoUrls', () => {
  test('returns non-empty photo URLs from JSON strings', () => {
    expect(parsePhotoUrls('["https://example.com/1.jpg", "", "https://example.com/2.jpg"]')).toEqual([
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
    ]);
  });

  test('handles missing and malformed photo values without crashing', () => {
    expect(parsePhotoUrls('not json')).toEqual([]);
    expect(parsePhotoUrls(null)).toEqual([]);
  });
});
