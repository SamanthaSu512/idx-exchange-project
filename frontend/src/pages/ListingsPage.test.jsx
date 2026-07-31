import { act } from 'react';
import { Simulate } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { fetchProperties } from '../api/client';
import ListingsPage from './ListingsPage';

jest.mock('../api/client', () => ({
  fetchProperties: jest.fn(),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const property = {
  id: 1,
  L_ListingID: '1001',
  L_Address: '100 Test Street',
  L_City: 'Manteca',
  L_State: 'CA',
  L_SystemPrice: 500000,
  L_Keyword2: 3,
  LM_Dec_3: '2.0',
  LM_Int2_3: 1800,
  L_Photos: '',
};

async function renderListingsPage() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(<ListingsPage />);
  });

  return {
    container,
    cleanup: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function getButton(container, text) {
  return Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent === text,
  );
}

function changeField(container, name, value) {
  const field = container.querySelector(`[name="${name}"]`);

  act(() => {
    Simulate.change(field, { target: { name, value } });
  });
}

describe('ListingsPage pagination', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    fetchProperties.mockResolvedValue({
      total: 45,
      limit: 20,
      results: [property],
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('changing pages preserves active filters and new filters reset to page 1', async () => {
    const { container, cleanup } = await renderListingsPage();

    expect(fetchProperties).toHaveBeenLastCalledWith({ limit: 20, offset: 0 });

    await act(async () => {
      Simulate.click(getButton(container, '2'));
    });

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(fetchProperties).toHaveBeenLastCalledWith({ limit: 20, offset: 20 });

    changeField(container, 'city', 'Manteca');

    await act(async () => {
      Simulate.submit(container.querySelector('form'));
    });

    expect(fetchProperties).toHaveBeenLastCalledWith({
      city: 'Manteca',
      limit: 20,
      offset: 0,
    });

    cleanup();
  });
});
