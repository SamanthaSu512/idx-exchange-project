import { useState } from 'react';

const EMPTY_FILTERS = {
  city: '',
  zipcode: '',
  minPrice: '',
  maxPrice: '',
  beds: '',
  baths: '',
};

function cleanFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => String(value).trim() !== ''),
  );
}

export default function PropertyFilters({ isLoading, onClear, onSearch }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  function updateFilter(event) {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSearch(cleanFilters(filters));
  }

  function handleClear() {
    setFilters(EMPTY_FILTERS);
    onClear();
  }

  return (
    <form className="property-filters" onSubmit={handleSubmit}>
      <div className="filter-grid">
        <label>
          City
          <input
            name="city"
            onChange={updateFilter}
            placeholder="Beverly Hills"
            type="text"
            value={filters.city}
          />
        </label>

        <label>
          ZIP code
          <input
            name="zipcode"
            onChange={updateFilter}
            placeholder="90210"
            type="text"
            value={filters.zipcode}
          />
        </label>

        <label>
          Min price
          <input
            min="0"
            name="minPrice"
            onChange={updateFilter}
            placeholder="300000"
            type="number"
            value={filters.minPrice}
          />
        </label>

        <label>
          Max price
          <input
            min="0"
            name="maxPrice"
            onChange={updateFilter}
            placeholder="1000000"
            type="number"
            value={filters.maxPrice}
          />
        </label>

        <label>
          Beds
          <select name="beds" onChange={updateFilter} value={filters.beds}>
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </label>

        <label>
          Baths
          <select name="baths" onChange={updateFilter} value={filters.baths}>
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </label>
      </div>

      <div className="filter-actions">
        <button type="submit" disabled={isLoading}>
          Search
        </button>
        <button type="button" className="secondary-button" disabled={isLoading} onClick={handleClear}>
          Clear Filters
        </button>
      </div>
    </form>
  );
}
