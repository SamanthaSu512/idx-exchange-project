import { act } from 'react';
import { Simulate } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import Pagination from './Pagination';
import { getPaginationItems } from './paginationItems';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderPagination(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);

  act(() => {
    root.render(<Pagination {...props} />);
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

describe('getPaginationItems', () => {
  test('renders all page numbers when the page count is small', () => {
    expect(getPaginationItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  test('renders middle pages with both ellipses', () => {
    expect(getPaginationItems(5, 24)).toEqual([
      1,
      'start-ellipsis',
      4,
      5,
      6,
      'end-ellipsis',
      24,
    ]);
  });

  test('does not duplicate the last page near the end', () => {
    expect(getPaginationItems(22, 24)).toEqual([
      1,
      'start-ellipsis',
      20,
      21,
      22,
      23,
      24,
    ]);
  });
});

describe('Pagination', () => {
  test('disables Previous on the first page', () => {
    const { container, cleanup } = renderPagination({
      currentPage: 1,
      onPageChange: jest.fn(),
      totalPages: 4,
    });

    expect(getButton(container, 'Previous').disabled).toBe(true);
    expect(getButton(container, 'Next').disabled).toBe(false);

    cleanup();
  });

  test('disables Next on the last page', () => {
    const { container, cleanup } = renderPagination({
      currentPage: 4,
      onPageChange: jest.fn(),
      totalPages: 4,
    });

    expect(getButton(container, 'Previous').disabled).toBe(false);
    expect(getButton(container, 'Next').disabled).toBe(true);

    cleanup();
  });

  test('clicking a page number navigates to that page', () => {
    const onPageChange = jest.fn();
    const { container, cleanup } = renderPagination({
      currentPage: 1,
      onPageChange,
      totalPages: 4,
    });

    act(() => {
      Simulate.click(getButton(container, '3'));
    });

    expect(onPageChange).toHaveBeenCalledWith(3);

    cleanup();
  });

  test('hides pagination when there is only one page', () => {
    const { container, cleanup } = renderPagination({
      currentPage: 1,
      onPageChange: jest.fn(),
      totalPages: 1,
    });

    expect(container.querySelector('.pagination')).toBeNull();

    cleanup();
  });
});
