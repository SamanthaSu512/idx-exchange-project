import { act } from 'react';
import { Simulate } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import PropertyCard from './PropertyCard';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const property = {
  L_ListingID: '1001',
  L_Address: '100 Test Street',
  L_City: 'Manteca',
  L_State: 'CA',
  L_SystemPrice: 500000,
  L_Keyword2: 3,
  LM_Dec_3: '2.0',
  LM_Int2_3: 1800,
  ListingContractDate: '2026-06-16',
  L_Photos: JSON.stringify(['https://example.com/photo.jpg']),
};

function renderPropertyCard(props = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);

  act(() => {
    root.render(
      <PropertyCard
        isFavorite={false}
        onOpen={jest.fn()}
        onToggleFavorite={jest.fn()}
        property={property}
        {...props}
      />,
    );
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

describe('PropertyCard', () => {
  test('renders property data and the first parsed photo', () => {
    const { container, cleanup } = renderPropertyCard();

    expect(container.textContent).toContain('$500,000');
    expect(container.textContent).toContain('100 Test Street');
    expect(container.textContent).toContain('Manteca, CA');
    expect(container.textContent).toContain('3');
    expect(container.textContent).toContain('1,800');
    expect(container.querySelector('img').getAttribute('src')).toBe(
      'https://example.com/photo.jpg',
    );

    cleanup();
  });

  test('clicking the card opens the detail page handler', () => {
    const onOpen = jest.fn();
    const { container, cleanup } = renderPropertyCard({ onOpen });

    act(() => {
      Simulate.click(container.querySelector('.property-card'));
    });

    expect(onOpen).toHaveBeenCalledTimes(1);

    cleanup();
  });

  test('clicking the favorite button does not open the detail page', () => {
    const onOpen = jest.fn();
    const onToggleFavorite = jest.fn();
    const { container, cleanup } = renderPropertyCard({ onOpen, onToggleFavorite });

    act(() => {
      Simulate.click(container.querySelector('.favorite-button'));
    });

    expect(onToggleFavorite).toHaveBeenCalledWith(property);
    expect(onOpen).not.toHaveBeenCalled();

    cleanup();
  });
});
