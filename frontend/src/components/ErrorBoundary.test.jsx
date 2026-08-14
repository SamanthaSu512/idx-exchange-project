import { act } from 'react';
import { Simulate } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './ErrorBoundary';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function BrokenComponent() {
  throw new Error('render failed');
}

describe('ErrorBoundary', () => {
  let originalConsoleError;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  test('shows a recovery UI when a child render fails', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>,
      );
    });

    expect(container.textContent).toContain('Something went wrong');

    act(() => {
      Simulate.click(container.querySelector('button'));
    });

    expect(container.textContent).toContain('Something went wrong');

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
