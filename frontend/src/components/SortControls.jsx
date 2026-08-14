const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'price', label: 'Price' },
  { value: 'dateListed', label: 'Date listed' },
  { value: 'sqft', label: 'Square footage' },
  { value: 'beds', label: 'Beds' },
];

export default function SortControls({ disabled, onChange, sortBy, sortOrder }) {
  function updateSortBy(event) {
    onChange({
      sortBy: event.target.value,
      sortOrder,
    });
  }

  function updateSortOrder(event) {
    onChange({
      sortBy,
      sortOrder: event.target.value,
    });
  }

  return (
    <section className="listing-toolbar" aria-label="Listing controls">
      <div className="sort-controls">
        <label>
          Sort by
          <select name="sortBy" value={sortBy} onChange={updateSortBy} disabled={disabled}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Order
          <select name="sortOrder" value={sortOrder} onChange={updateSortOrder} disabled={disabled || !sortBy}>
            <option value="asc">Low to high</option>
            <option value="desc">High to low</option>
          </select>
        </label>
      </div>
    </section>
  );
}
