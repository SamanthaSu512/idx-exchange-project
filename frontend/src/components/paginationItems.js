function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 1) {
    return [];
  }

  if (totalPages <= 7) {
    return range(1, totalPages);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'end-ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'start-ellipsis', ...range(totalPages - 4, totalPages)];
  }

  return [
    1,
    'start-ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'end-ellipsis',
    totalPages,
  ];
}
