import { getPaginationItems } from './paginationItems';

export default function Pagination({ currentPage, onPageChange, totalPages }) {
  const items = getPaginationItems(currentPage, totalPages);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="Property listings pagination">
      <button
        type="button"
        className="page-button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>

      <div className="page-numbers">
        {items.map((item) => {
          if (typeof item === 'string') {
            return (
              <span key={item} className="page-ellipsis" aria-hidden="true">
                ...
              </span>
            );
          }

          return (
            <button
              type="button"
              aria-current={item === currentPage ? 'page' : undefined}
              className={`page-number ${item === currentPage ? 'is-active' : ''}`}
              key={item}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="page-button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </nav>
  );
}
