import { getOpenHouseRemarks } from './openHouses';

describe('getOpenHouseRemarks', () => {
  test('extracts remarks from the all_data JSON blob', () => {
    expect(getOpenHouseRemarks({ all_data: '{"OpenHouseRemarks":"Park by the sign."}' })).toBe(
      'Park by the sign.',
    );
  });

  test('returns an empty string for malformed all_data values', () => {
    expect(getOpenHouseRemarks({ all_data: 'not json' })).toBe('');
  });
});
