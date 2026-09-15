import { act } from 'react';
import { Simulate } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import PropertyImageCarousel from './PropertyImageCarousel';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderCarousel(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);

  act(() => {
    root.render(<PropertyImageCarousel alt="Test home" {...props} />);
  });

  return {
    container,
    rerender: (nextProps) => {
      act(() => {
        root.render(<PropertyImageCarousel alt="Test home" {...nextProps} />);
      });
    },
    cleanup: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('PropertyImageCarousel', () => {
  test('falls back to no photo when there are no photos', () => {
    const { container, cleanup } = renderCarousel({ photos: [] });

    expect(container.textContent).toContain('No photo');
    expect(container.querySelector('img')).toBeNull();

    cleanup();
  });

  test('shows a fallback when the current cover image fails', () => {
    const { container, cleanup } = renderCarousel({
      photos: ['https://example.com/broken.jpg', 'https://example.com/working.jpg'],
    });

    expect(container.querySelector('img').getAttribute('src')).toBe(
      'https://example.com/broken.jpg',
    );

    act(() => {
      Simulate.error(container.querySelector('img'));
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('Photo unavailable');
    expect(container.textContent).toContain('1 / 2');

    cleanup();
  });

  test('resets failed image state when the property photos change', () => {
    const { container, cleanup, rerender } = renderCarousel({
      photos: ['https://example.com/first-broken.jpg', 'https://example.com/first-working.jpg'],
    });

    act(() => {
      Simulate.error(container.querySelector('img'));
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('Photo unavailable');

    rerender({ photos: ['https://example.com/new-first.jpg'] });

    expect(container.querySelector('img').getAttribute('src')).toBe(
      'https://example.com/new-first.jpg',
    );
    expect(container.textContent).toContain('1 / 1');

    cleanup();
  });

});
