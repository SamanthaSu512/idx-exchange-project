import { act } from 'react';
import { Simulate } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import PropertyFilters from './PropertyFilters';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderFilters(props = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);

  act(() => {
    root.render(
      <PropertyFilters
        isLoading={false}
        onClear={jest.fn()}
        onSearch={jest.fn()}
        {...props}
      />,
    );
  });

  return {
    container,
    root,
    cleanup: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function changeField(container, name, value) {
  const field = container.querySelector(`[name="${name}"]`);

  act(() => {
    Simulate.change(field, { target: { name, value } });
  });
}

describe('PropertyFilters', () => {
  test('displays all six filter inputs', () => {
    const { container, cleanup } = renderFilters();

    expect(container.querySelector('[name="city"]')).not.toBeNull();
    expect(container.querySelector('[name="zipcode"]')).not.toBeNull();
    expect(container.querySelector('[name="minPrice"]')).not.toBeNull();
    expect(container.querySelector('[name="maxPrice"]')).not.toBeNull();
    expect(container.querySelector('[name="beds"]')).not.toBeNull();
    expect(container.querySelector('[name="baths"]')).not.toBeNull();

    cleanup();
  });

  test('submits combined non-empty filters', () => {
    const onSearch = jest.fn();
    const { container, cleanup } = renderFilters({ onSearch });

    changeField(container, 'city', 'Manteca');
    changeField(container, 'zipcode', '');
    changeField(container, 'minPrice', '300000');
    changeField(container, 'maxPrice', '800000');
    changeField(container, 'beds', '3');
    changeField(container, 'baths', '2');

    act(() => {
      Simulate.submit(container.querySelector('form'));
    });

    expect(onSearch).toHaveBeenCalledWith({
      city: 'Manteca',
      minPrice: '300000',
      maxPrice: '800000',
      beds: '3',
      baths: '2',
    });

    cleanup();
  });

  test('clear resets the form and reloads all properties', () => {
    const onClear = jest.fn();
    const { container, cleanup } = renderFilters({ onClear });

    changeField(container, 'city', 'Manteca');

    act(() => {
      Simulate.click(container.querySelector('.secondary-button'));
    });

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[name="city"]').value).toBe('');

    cleanup();
  });
});
