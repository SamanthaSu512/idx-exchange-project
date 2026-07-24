import { fetchProperties, fetchPropertyDetail } from './client';

describe('api client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('fetchProperties sends non-empty query parameters', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 1, results: [] }),
    });

    await fetchProperties({
      city: 'Manteca',
      zipcode: '',
      minPrice: '300000',
      beds: '3',
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/properties?city=Manteca&minPrice=300000&beds=3');
  });

  test('fetchProperties omits empty values', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, results: [] }),
    });

    await fetchProperties({
      city: '',
      zipcode: null,
      maxPrice: undefined,
      baths: '2',
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/properties?baths=2');
  });

  test('fetchProperties throws meaningful HTTP errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'limit must be at least 1' }),
    });

    await expect(fetchProperties({ limit: 0 })).rejects.toThrow('limit must be at least 1');
  });

  test('fetchPropertyDetail encodes listing IDs', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ L_ListingID: 'abc 123' }),
    });

    await fetchPropertyDetail('abc 123');

    expect(global.fetch).toHaveBeenCalledWith('/api/properties/abc%20123');
  });
});
